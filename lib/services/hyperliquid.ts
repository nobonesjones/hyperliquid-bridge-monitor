// No need to import WebSocket, using browser native API

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
