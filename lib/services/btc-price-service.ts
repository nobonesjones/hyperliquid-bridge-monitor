export interface BTCPriceData {
  price: number;
  timestamp: number;
  source: 'coingecko' | 'hyperliquid' | 'cache';
  change24h?: number;
  volume24h?: number;
}

export interface BTCHistoricalPrice {
  timestamp: number;
  price: number;
}

class BTCPriceService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for real-time price
  private readonly HISTORICAL_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for historical data

  // Get current BTC price with fallback
  async getCurrentPrice(): Promise<BTCPriceData> {
    console.log('🚀 Getting current BTC price...');
    const cacheKey = 'btc_current_price';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('💾 Using cached price:', cached);
      return cached as BTCPriceData;
    }

    try {
      // Try CoinGecko first (more comprehensive data)
      console.log('🔥 Trying CoinGecko API...');
      const coinGeckoPrice = await this.fetchFromCoinGecko();
      this.setCache(cacheKey, coinGeckoPrice);
      return coinGeckoPrice;
    } catch (error) {
      console.error('❌ CoinGecko failed:', error);
      console.log('🔄 Trying Hyperliquid as fallback...');
      
      try {
        // Fallback to Hyperliquid
        const hyperliquidPrice = await this.fetchFromHyperliquid();
        this.setCache(cacheKey, hyperliquidPrice);
        return hyperliquidPrice;
      } catch (hyperliquidError) {
        console.error('❌ Hyperliquid also failed:', hyperliquidError);
        console.error('💥 Both price sources failed!');
        
        // Return last cached price if available
        const lastCached = this.getFromCache(cacheKey, true); // ignore expiry
        if (lastCached) {
          console.log('🕒 Using expired cache as last resort:', lastCached);
          return { ...(lastCached as BTCPriceData), source: 'cache' };
        }
        
        // Final fallback to mock price
        console.log('🎭 Using mock fallback price: $105,000');
        return {
          price: 105000,
          timestamp: Date.now(),
          source: 'cache'
        };
      }
    }
  }

  // Get historical BTC prices
  async getHistoricalPrices(timeframe: '15m' | '1h' | '4h' | '12h' | '24h' | '7d' | '30d' = '24h'): Promise<BTCHistoricalPrice[]> {
    const cacheKey = `btc_historical_${timeframe}`;
    const cached = this.getFromCache(cacheKey, false, this.HISTORICAL_CACHE_DURATION);
    
    if (cached) {
      return cached as BTCHistoricalPrice[];
    }

    try {
      let days: number;
      let interval: string;

      switch (timeframe) {
        case '15m':
          days = 0.25; // 6 hours of data to get good 15min intervals
          interval = 'minutely';
          break;
        case '1h':
          days = 0.5; // 12 hours of data  
          interval = 'minutely';
          break;
        case '4h':
          days = 1; // 24 hours of data
          interval = 'minutely';
          break;
        case '12h':
          days = 1; // 24 hours of data
          interval = 'minutely';
          break;
        case '24h':
          days = 1;
          interval = 'minutely'; // Changed to minutely for better granularity
          break;
        case '7d':
          days = 7;
          interval = 'hourly';
          break;
        case '30d':
          days = 30;
          interval = 'daily';
          break;
        default:
          days = 1;
          interval = 'minutely';
      }

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=${interval}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let prices: BTCHistoricalPrice[] = data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price
      }));

      // Aggregate data for shorter timeframes
      if (['15m', '1h', '4h', '12h'].includes(timeframe)) {
        prices = this.aggregateData(prices, timeframe);
      }

      this.setCache(cacheKey, prices, this.HISTORICAL_CACHE_DURATION);
      return prices;
    } catch (error) {
      console.error('Error fetching historical BTC prices:', error);
      
      // Return mock historical data as fallback
      return this.generateMockHistoricalData(timeframe);
    }
  }

  // Fetch from CoinGecko API
  private async fetchFromCoinGecko(): Promise<BTCPriceData> {
    console.log('🔄 Fetching BTC price from CoinGecko...');
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true'
    );

    console.log('📡 CoinGecko response status:', response.status);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 CoinGecko data:', data);
    
    if (!data.bitcoin || !data.bitcoin.usd) {
      throw new Error('Invalid response format from CoinGecko');
    }

    const bitcoin = data.bitcoin;
    const result = {
      price: bitcoin.usd,
      timestamp: Date.now(),
      source: 'coingecko' as const,
      change24h: bitcoin.usd_24h_change,
      volume24h: bitcoin.usd_24h_vol
    };

    console.log('✅ CoinGecko result:', result);
    return result;
  }

  // Fetch from Hyperliquid API
  private async fetchFromHyperliquid(): Promise<BTCPriceData> {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'l2Book',
        coin: 'BTC'
      })
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Get mid price from order book
    const bestBid = parseFloat(data.levels[0][0].px);
    const bestAsk = parseFloat(data.levels[1][0].px);
    const midPrice = (bestBid + bestAsk) / 2;

    return {
      price: midPrice,
      timestamp: Date.now(),
      source: 'hyperliquid'
    };
  }

  // Cache management
  private getFromCache(key: string, ignoreExpiry: boolean = false, duration: number = this.CACHE_DURATION): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (!ignoreExpiry && Date.now() - cached.timestamp > duration) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, duration: number = this.CACHE_DURATION): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Aggregate minutely data into specified intervals
  private aggregateData(data: BTCHistoricalPrice[], timeframe: string): BTCHistoricalPrice[] {
    const intervals: { [key: string]: number } = {
      '15m': 15 * 60 * 1000,  // 15 minutes in milliseconds
      '1h': 60 * 60 * 1000,   // 1 hour
      '4h': 4 * 60 * 60 * 1000, // 4 hours  
      '12h': 12 * 60 * 60 * 1000 // 12 hours
    };

    const intervalMs = intervals[timeframe];
    if (!intervalMs) return data;

    const aggregated: BTCHistoricalPrice[] = [];
    const buckets: { [key: number]: BTCHistoricalPrice[] } = {};

    // Group data into time buckets
    data.forEach(point => {
      const bucketTime = Math.floor(point.timestamp / intervalMs) * intervalMs;
      if (!buckets[bucketTime]) {
        buckets[bucketTime] = [];
      }
      buckets[bucketTime].push(point);
    });

    // Calculate average price for each bucket
    Object.keys(buckets).forEach(bucketTime => {
      const bucket = buckets[parseInt(bucketTime)];
      const avgPrice = bucket.reduce((sum, point) => sum + point.price, 0) / bucket.length;
      
      aggregated.push({
        timestamp: parseInt(bucketTime),
        price: avgPrice
      });
    });

    return aggregated.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Generate mock historical data for fallback
  private generateMockHistoricalData(timeframe: '15m' | '1h' | '4h' | '12h' | '24h' | '7d' | '30d'): BTCHistoricalPrice[] {
    const now = Date.now();
    const basePrice = 105000;
    let points: number;
    let interval: number;

    switch (timeframe) {
      case '15m':
        points = 24; // 6 hours of data
        interval = 15 * 60 * 1000; // 15 minutes
        break;
      case '1h':
        points = 12; // 12 hours of data
        interval = 60 * 60 * 1000; // 1 hour
        break;
      case '4h':
        points = 6; // 24 hours of data
        interval = 4 * 60 * 60 * 1000; // 4 hours
        break;
      case '12h':
        points = 4; // 48 hours of data
        interval = 12 * 60 * 60 * 1000; // 12 hours
        break;
      case '24h':
        points = 24;
        interval = 60 * 60 * 1000; // 1 hour
        break;
      case '7d':
        points = 7;
        interval = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '30d':
        points = 30;
        interval = 24 * 60 * 60 * 1000; // 1 day
        break;
      default:
        points = 24;
        interval = 60 * 60 * 1000;
    }

    return Array.from({ length: points }, (_, i) => ({
      timestamp: now - (points - 1 - i) * interval,
      price: basePrice + (Math.random() - 0.5) * 4000 // ±$2000 variation
    }));
  }

  // Clear all cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache info for debugging
  getCacheInfo(): { key: string; size: number; age: number }[] {
    return Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      size: JSON.stringify(value.data).length,
      age: Date.now() - value.timestamp
    }));
  }
}

// Export singleton instance
export const btcPriceService = new BTCPriceService();

// Utility functions for easy use
export async function getCurrentBTCPrice(): Promise<number> {
  const data = await btcPriceService.getCurrentPrice();
  return data.price;
}

export async function getBTCPriceData(): Promise<BTCPriceData> {
  return btcPriceService.getCurrentPrice();
}

export async function getHistoricalBTCPrices(timeframe: '15m' | '1h' | '4h' | '12h' | '24h' | '7d' | '30d' = '24h'): Promise<BTCHistoricalPrice[]> {
  return btcPriceService.getHistoricalPrices(timeframe);
} 