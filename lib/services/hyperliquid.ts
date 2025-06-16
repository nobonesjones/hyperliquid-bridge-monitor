// No need to import WebSocket, using browser native API
import axios from 'axios'

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

export interface HyperliquidConfig {
  wsUrl: string
  restUrl: string
}

export interface Deposit {
  transaction: string
  wallet: string
  amount: number
  timestamp: number
  direction: 'in' | 'out'
}

export interface TraderInfo {
  wallet: string
  pnl7d: number
  pnl30d: number
  openPositions: number
}

class HyperliquidService {
  private ws: WebSocket | null = null
  private config: HyperliquidConfig = {
    wsUrl: 'wss://api.hyperliquid.xyz/ws',
    restUrl: 'https://api.hyperliquid.xyz/v1'
  }

  constructor(config?: Partial<HyperliquidConfig>) {
    this.config = { ...this.config, ...config }
  }

  private async post(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.config.restUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        action: data.type,
        args: data.params || {}
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, body: ${error}`)
    }

    return response.json()
  }

  // Connect to WebSocket
  public connect(onMessage: (data: any) => void): void {
    if (this.ws) {
      this.ws.close()
    }

    this.ws = new WebSocket(this.config.wsUrl)

    this.ws.onopen = () => {
      console.log('Connected to Hyperliquid WebSocket')
      // Subscribe to trade events
      this.subscribe()
    }

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        console.log('WebSocket message:', parsed) // Debug log
        onMessage(parsed)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.ws.onclose = () => {
      console.log('WebSocket connection closed')
      // Attempt to reconnect after a delay
      setTimeout(() => this.connect(onMessage), 5000)
    }
  }

  // Subscribe to relevant events
  private subscribe(): void {
    if (!this.ws) return

    const subscribeMsg = {
      method: 'subscribe',
      subscription: {
        type: 'trades',
        coin: 'BTC'
      }
    }

    console.log('Sending subscription:', subscribeMsg) // Debug log
    this.ws.send(JSON.stringify(subscribeMsg))
  }

  // Get recent large deposits
  public async getRecentDeposits(threshold: number = 100000): Promise<Deposit[]> {
    const [orderBook, trades] = await Promise.all([
      this.post('/chain', {
        type: 'orderBook',
        params: {
          coin: 'BTC'
        }
      }),
      this.post('/chain', {
        type: 'trades',
        params: {
          coin: 'BTC',
          limit: 100
        }
      })
    ])
    
    const currentPrice = parseFloat(orderBook.levels[0][0].px)
    
    return (trades || [])
      .filter((trade: any) => {
        const amount = parseFloat(trade.sz) * currentPrice
        return amount >= threshold
      })
      .map((trade: any) => ({
        transaction: trade.oid,
        wallet: trade.uid,
        amount: parseFloat(trade.sz) * currentPrice,
        timestamp: trade.time,
        direction: trade.side === 'B' ? 'in' : 'out'
      }))
  }

  // Get trader information
  public async getTraderInfo(wallet: string): Promise<TraderInfo> {
    const [positions, orderBook] = await Promise.all([
      this.post('/chain', {
        type: 'positions',
        params: {
          coin: 'BTC',
          user: wallet
        }
      }),
      this.post('/chain', {
        type: 'orderBook',
        params: {
          coin: 'BTC'
        }
      })
    ])

    const currentPrice = parseFloat(orderBook.levels[0][0].px)
    
    // Calculate PnL from positions
    const totalPnl = (positions || []).reduce((sum: number, pos: any) => {
      const size = parseFloat(pos.sz)
      const entryPrice = parseFloat(pos.entryPx)
      const pnl = size * (currentPrice - entryPrice)
      return sum + pnl
    }, 0)

    return {
      wallet,
      pnl7d: totalPnl, // We'll need historical data for accurate 7d PnL
      pnl30d: totalPnl, // We'll need historical data for accurate 30d PnL
      openPositions: positions?.length || 0
    }
  }

  // Get 24h deposit volume
  public async get24hVolume(): Promise<number> {
    const data = await this.post('/chain', {
      type: 'stats',
      params: {
        coin: 'BTC'
      }
    })
    return parseFloat(data.vol24h || '0')
  }

  // Get 1h deposits
  public async get1hDeposits(): Promise<number> {
    const [orderBook, trades] = await Promise.all([
      this.post('/chain', {
        type: 'orderBook',
        params: {
          coin: 'BTC'
        }
      }),
      this.post('/chain', {
        type: 'trades',
        params: {
          coin: 'BTC',
          limit: 1000
        }
      })
    ])
    
    const currentPrice = parseFloat(orderBook.levels[0][0].px)
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    
    return (trades || [])
      .filter((trade: any) => trade.time >= oneHourAgo)
      .reduce((sum: number, trade: any) => 
        sum + (parseFloat(trade.sz) * currentPrice), 0)
  }

  // Close WebSocket connection
  public disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Export singleton instance
export const hyperliquid = new HyperliquidService()

// Export types
export type { HyperliquidService }

interface CumulativeFunding {
  allTime: number;
  sinceChange: number;
  sinceOpen: number;
}

interface Position {
  coin: string;
  position: number;
  entryPrice: number;
  unrealizedPnl: number;
  leverage: number;
  liquidationPrice: number;
  margin: number;
  positionValue: number;
  returnOnEquity: number;
  maxLeverage: number;
  cumFunding: CumulativeFunding;
  currentFunding: number;
  markPrice: number;
  side: 'long' | 'short';
  sizeUSD: number;
  health: number; // 0-100, higher is better
  openedAt?: number; // timestamp when position was opened
  ageInMs?: number; // calculated age in milliseconds
}

interface AssetContext {
  markPrice: number;
  funding: number;
  openInterest: number;
  dayVolume: number;
}

interface PortfolioData {
  day: { accountValueHistory: [number, string][], pnlHistory: [number, string][] };
  week: { accountValueHistory: [number, string][], pnlHistory: [number, string][] };
  month: { accountValueHistory: [number, string][], pnlHistory: [number, string][] };
  allTime: { accountValueHistory: [number, string][], pnlHistory: [number, string][] };
}

interface WalletData {
  address: string;
  positions: Position[];
  totalUnrealizedPnl: number;
  totalValue: number;
  marginUsed: number;
  freeMargin: number;
  portfolioDelta: number; // Positive means net long, negative means net short
  allTimePnl: number;
  portfolioHistory?: PortfolioData;
}

interface Position {
  side: 'long' | 'short'
  sizeUSD: number
}

interface WalletData {
  positions: Position[]
  address: string
  totalUnrealizedPnl: number
  totalValue: number
  marginUsed: number
  freeMargin: number
  portfolioDelta: number
  allTimePnl: number;
}

export class HyperliquidAPI {
  private baseUrl: string
  private wsUrl: string
  private static instance: HyperliquidAPI

  private constructor() {
    this.baseUrl = 'https://api.hyperliquid.xyz'
    this.wsUrl = 'wss://api.hyperliquid.xyz/ws'
  }

  public static getInstance(): HyperliquidAPI {
    if (!HyperliquidAPI.instance) {
      HyperliquidAPI.instance = new HyperliquidAPI()
    }
    return HyperliquidAPI.instance
  }

  async getWalletData(address: string): Promise<WalletData> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: address,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch wallet data')
      }

      const data = await response.json()
      
      // For position bias calculation, we only need positions
      return {
        positions: data.assetPositions?.map((pos: any) => ({
          side: pos.position.side.toLowerCase(),
          sizeUSD: parseFloat(pos.position.sizeUsd),
        })) || [],
        address,
        totalUnrealizedPnl: 0,
        totalValue: 0,
        marginUsed: 0,
        freeMargin: 0,
        portfolioDelta: 0,
        allTimePnl: 0
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
      return {
        positions: [],
        address,
        totalUnrealizedPnl: 0,
        totalValue: 0,
        marginUsed: 0,
        freeMargin: 0,
        portfolioDelta: 0,
        allTimePnl: 0
      }
    }
  }

  private calculatePositionHealth(position: number, entryPrice: number, markPrice: number, liquidationPrice: number): number {
    const isLong = position > 0;
    const currentDistance = isLong ? 
      markPrice - liquidationPrice :
      liquidationPrice - markPrice;
    const maxDistance = isLong ?
      entryPrice - liquidationPrice :
      liquidationPrice - entryPrice;
    
    // Health is the percentage of distance to liquidation remaining
    return Math.min(Math.max((currentDistance / maxDistance) * 100, 0), 100);
  }

  async getWalletPositions(address: string): Promise<WalletData> {
    try {
      // First get the meta data and asset contexts
      const metaResponse = await axios.post(HYPERLIQUID_API_URL, {
        type: "metaAndAssetCtxs"
      });
      
      const assetContexts = new Map<string, AssetContext>(
        metaResponse.data[1].map((ctx: any, index: number) => [
          metaResponse.data[0].universe[index].name,
          {
            markPrice: parseFloat(ctx.markPx),
            funding: parseFloat(ctx.funding),
            openInterest: parseFloat(ctx.openInterest),
            dayVolume: parseFloat(ctx.dayNtlVlm)
          }
        ])
      );

      // Get the user's positions, portfolio history, and trade history in parallel
      // Use a longer time range for trade history to catch older positions
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const [response, portfolioResponse, tradeHistoryResponse] = await Promise.all([
        axios.post(HYPERLIQUID_API_URL, {
          type: "clearinghouseState",
          user: address
        }),
        axios.post(HYPERLIQUID_API_URL, {
          type: "portfolio",
          user: address
        }),
        axios.post(HYPERLIQUID_API_URL, {
          type: "userFills",
          user: address,
          startTime: thirtyDaysAgo,
          endTime: Date.now()
        })
      ]);

      // Calculate all-time realized PnL from trade history
      const allTimePnl = this.calculateAllTimePnl(tradeHistoryResponse.data);

      // Parse portfolio history data
      const portfolioHistory: PortfolioData | undefined = portfolioResponse.data ? {
        day: this.parsePortfolioTimeframe(portfolioResponse.data, 'day'),
        week: this.parsePortfolioTimeframe(portfolioResponse.data, 'week'), 
        month: this.parsePortfolioTimeframe(portfolioResponse.data, 'month'),
        allTime: this.parsePortfolioTimeframe(portfolioResponse.data, 'allTime')
      } : undefined;

      // Log the response for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('API Response:', response.data);
        console.log('Margin Summary:', response.data?.marginSummary);
        console.log('Portfolio History:', portfolioHistory);
        console.log('Trade History Length:', tradeHistoryResponse.data?.length || 0);
        console.log('Trade History Sample:', tradeHistoryResponse.data?.slice(0, 3));
        
        // Log position data for debugging
        if (response.data?.assetPositions) {
          console.log('Asset Positions:', response.data.assetPositions.map((pos: any) => ({
            coin: pos.position.coin,
            size: pos.position.szi,
            entryPrice: pos.position.entryPx
          })));
        }
      }

      const positions = (response.data?.assetPositions || []).map((pos: any) => {
        const position = pos.position;
        const assetCtx = assetContexts.get(position.coin);
        const sz = parseFloat(position.szi) || 0;
        const px = parseFloat(position.entryPx) || 0;
        const markPrice = assetCtx?.markPrice || px;
        const liquidationPrice = parseFloat(position.liquidationPx) || 0;
        const leverageValue = typeof position.leverage === 'object' ? 
          parseFloat(position.leverage.value) : 
          parseFloat(position.leverage || "1");

        // Get position opening time and calculate age
        const openedAt = this.getPositionOpenTime(position.coin, tradeHistoryResponse.data, sz);
        const currentTime = Date.now();
        const ageInMs = openedAt ? currentTime - openedAt : undefined;

        return {
          coin: position.coin,
          position: sz,
          entryPrice: px,
          unrealizedPnl: parseFloat(position.unrealizedPnl) || 0,
          leverage: leverageValue,
          liquidationPrice: liquidationPrice,
          margin: parseFloat(position.marginUsed) || 0,
          positionValue: parseFloat(position.positionValue) || Math.abs(sz * markPrice),
          returnOnEquity: parseFloat(position.returnOnEquity) || 0,
          maxLeverage: parseFloat(position.maxLeverage) || 0,
          cumFunding: {
            allTime: parseFloat(position.cumFunding?.allTime) || 0,
            sinceChange: parseFloat(position.cumFunding?.sinceChange) || 0,
            sinceOpen: parseFloat(position.cumFunding?.sinceOpen) || 0
          },
          currentFunding: assetCtx?.funding || 0,
          markPrice: markPrice,
          side: sz > 0 ? 'long' : 'short',
          sizeUSD: Math.abs(sz * markPrice),
          health: this.calculatePositionHealth(sz, px, markPrice, liquidationPrice),
          openedAt: openedAt,
          ageInMs: ageInMs
        };
      });

      const totalUnrealizedPnl = positions.reduce((sum: number, pos: Position) => sum + pos.unrealizedPnl, 0);
      
      // Get the actual account value and margin data from the API response
      const marginSummary = response.data?.marginSummary || {};
      const accountValue = parseFloat(marginSummary.accountValue || "0");
      const marginUsed = parseFloat(marginSummary.totalMarginUsed || "0");
      const totalNtlPos = parseFloat(marginSummary.totalNtlPos || "0");
      const withdrawable = parseFloat(response.data?.withdrawable || "0");
      
      // Total value should be account value (equity)
      const totalValue = accountValue;
      // Free margin is withdrawable amount
      const freeMargin = withdrawable;
      
      // Calculate portfolio delta (sum of position values, keeping sign)
      const portfolioDelta = positions.reduce((sum: number, pos: Position) => {
        return sum + (pos.side === 'long' ? pos.sizeUSD : -pos.sizeUSD);
      }, 0);

      return {
        address,
        positions,
        totalUnrealizedPnl,
        totalValue,
        marginUsed,
        freeMargin,
        portfolioDelta,
        allTimePnl,
        portfolioHistory
      };
    } catch (error) {
      console.error('Error fetching wallet positions:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
      }
      throw error;
    }
  }

  private parsePortfolioTimeframe(portfolioData: any[], timeframe: string) {
    try {
      const timeframeData = portfolioData.find(([period]) => period === timeframe);
      if (!timeframeData || !timeframeData[1]) {
        return { accountValueHistory: [], pnlHistory: [] };
      }
      
      return {
        accountValueHistory: timeframeData[1].accountValueHistory || [],
        pnlHistory: timeframeData[1].pnlHistory || []
      };
    } catch (error) {
      console.error(`Error parsing ${timeframe} portfolio data:`, error);
      return { accountValueHistory: [], pnlHistory: [] };
    }
  }

  private calculateAllTimePnl(tradeHistory: any[]): number {
    if (!tradeHistory || !Array.isArray(tradeHistory) || tradeHistory.length === 0) {
      return 0;
    }

    try {
      // Sum up realized PnL from all trades
      return tradeHistory.reduce((total, trade) => {
        const pnl = parseFloat(trade.realizedPnl || "0");
        return total + (isNaN(pnl) ? 0 : pnl);
      }, 0);
    } catch (error) {
      console.error('Error calculating all-time PnL:', error);
      return 0;
    }
  }

  private getPositionOpenTime(coin: string, tradeHistory: any[], currentPositionSize: number): number | undefined {
    if (!tradeHistory || !Array.isArray(tradeHistory) || tradeHistory.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`No trade history available for ${coin}`);
      }
      return undefined;
    }

    try {
      // Sort trades by timestamp to find the most recent position opening
      const coinTrades = tradeHistory
        .filter(trade => trade.coin === coin)
        .sort((a, b) => b.time - a.time); // Sort descending (newest first)

      if (coinTrades.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`No trades found for ${coin} in trade history`);
        }
        return undefined;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`Found ${coinTrades.length} trades for ${coin}, current position size: ${currentPositionSize}`);
        console.log(`Recent trades for ${coin}:`, coinTrades.slice(0, 3).map(t => ({
          side: t.side,
          size: t.sz,
          time: new Date(t.time).toISOString(),
          timestamp: t.time
        })));
      }

      // Simple approach: find the most recent trade that would have opened or added to the current position
      // If we have a long position, find the most recent buy
      // If we have a short position, find the most recent sell
      const isLongPosition = currentPositionSize > 0;
      const targetSide = isLongPosition ? 'B' : 'A'; // B = Buy, A = Sell
      
      // Find the most recent trade in the same direction as current position
      const relevantTrade = coinTrades.find(trade => trade.side === targetSide);
      
      if (relevantTrade) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Using most recent ${targetSide === 'B' ? 'buy' : 'sell'} trade for ${coin} position opening: ${new Date(relevantTrade.time).toISOString()}`);
        }
        return relevantTrade.time;
      }

      // Fallback: use the most recent trade regardless of side
      if (coinTrades.length > 0) {
        const fallbackTime = coinTrades[0].time;
        if (process.env.NODE_ENV === 'development') {
          console.log(`Using most recent trade as fallback for ${coin}: ${new Date(fallbackTime).toISOString()}`);
        }
        return fallbackTime;
      }

      return undefined;
    } catch (error) {
      console.error(`Error getting position open time for ${coin}:`, error);
      return undefined;
    }
  }
}

export const hyperliquidAPI = HyperliquidAPI.getInstance();
