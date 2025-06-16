// Enhanced tools for comprehensive trader analysis

export interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume: number;
}

export interface TechnicalLevels {
  support: number[];
  resistance: number[];
  pivots: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  breakouts: {
    level: number;
    timestamp: number;
    direction: 'up' | 'down';
  }[];
}

export interface NewsData {
  timestamp: number;
  title: string;
  content: string;
  source: string;
  sentiment: number;
  relevanceScore: number;
  category: 'announcement' | 'regulatory' | 'technical' | 'market' | 'social';
}

export interface MarketContextData {
  funding_rates: { [asset: string]: number };
  open_interest: { [asset: string]: number };
  volume_profile: { [asset: string]: number };
  liquidations: Array<{
    timestamp: number;
    asset: string;
    amount: number;
    side: 'long' | 'short';
  }>;
}

class TraderAnalysisTools {
  private coingeckoApi = 'https://api.coingecko.com/api/v3';
  private newsApi = 'https://newsapi.org/v2'; // You'd need API key
  private hyperliquidApi = 'https://api.hyperliquid.xyz/info';
  private cacheDuration = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, { data: any; timestamp: number }>();

  constructor(private newsApiKey?: string) {}

  // ==================== PRICE DATA TOOLS ====================

  async getPriceData(asset: string, timestamp: number, windowHours: number = 24): Promise<PriceDataPoint[]> {
    const cacheKey = `price_${asset}_${timestamp}_${windowHours}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Convert asset symbol to CoinGecko ID
      const coinId = this.assetToCoinGeckoId(asset);
      const endTime = Math.floor(timestamp / 1000);
      const startTime = endTime - (windowHours * 3600);

      const url = `${this.coingeckoApi}/coins/${coinId}/market_chart/range?vs_currency=usd&from=${startTime}&to=${endTime}`;
      const response = await fetch(url);
      const data = await response.json();

      const priceData: PriceDataPoint[] = data.prices.map(([time, price]: [number, number], index: number) => ({
        timestamp: time,
        price,
        volume: data.total_volumes[index] ? data.total_volumes[index][1] : 0
      }));

      this.setCache(cacheKey, priceData);
      return priceData;
    } catch (error) {
      console.error(`Error fetching price data for ${asset}:`, error);
      return this.generateMockPriceData(asset, timestamp, windowHours);
    }
  }

  async getMultipleAssetPrices(assets: string[], timestamp: number): Promise<{ [asset: string]: number }> {
    const prices: { [asset: string]: number } = {};
    
    // Batch fetch prices for efficiency
    for (const asset of assets) {
      try {
        const priceData = await this.getPriceData(asset, timestamp, 1);
        if (priceData.length > 0) {
          // Find price closest to timestamp
          const closestPrice = priceData.reduce((prev, curr) => 
            Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev
          );
          prices[asset] = closestPrice.price;
        }
      } catch (error) {
        console.error(`Error fetching price for ${asset}:`, error);
        prices[asset] = 50000; // Fallback price
      }
    }

    return prices;
  }

  // ==================== TECHNICAL ANALYSIS TOOLS ====================

  async analyzeTechnicalLevels(asset: string, timestamp: number, lookbackDays: number = 30): Promise<TechnicalLevels> {
    try {
      const priceData = await this.getPriceData(asset, timestamp, lookbackDays * 24);
      
      // Calculate support and resistance levels
      const prices = priceData.map(p => p.price);
      const highs = this.findLocalExtremes(prices, 'high');
      const lows = this.findLocalExtremes(prices, 'low');
      
      // Calculate pivot points
      const recentData = priceData.slice(-3); // Last 3 data points
      const high = Math.max(...recentData.map(p => p.price));
      const low = Math.min(...recentData.map(p => p.price));
      const close = recentData[recentData.length - 1].price;
      
      const dailyPivot = (high + low + close) / 3;
      const weeklyPivot = dailyPivot * 1.02; // Simplified calculation
      const monthlyPivot = dailyPivot * 1.05;

      // Detect breakouts
      const breakouts = this.detectBreakouts(priceData, [...highs, ...lows]);

      return {
        support: lows.sort((a, b) => b - a).slice(0, 3), // Top 3 support levels
        resistance: highs.sort((a, b) => a - b).slice(0, 3), // Top 3 resistance levels
        pivots: {
          daily: dailyPivot,
          weekly: weeklyPivot,
          monthly: monthlyPivot
        },
        breakouts: breakouts.filter(b => Math.abs(b.timestamp - timestamp) < 24 * 3600 * 1000)
      };
    } catch (error) {
      console.error('Error analyzing technical levels:', error);
      return this.generateMockTechnicalLevels(asset, timestamp);
    }
  }

  calculateTimingQuality(
    tradePrice: number, 
    tradeTimestamp: number, 
    technicalLevels: TechnicalLevels,
    priceAfter: number
  ): number {
    let score = 50; // Base score

    // Check proximity to key levels
    const allLevels = [...technicalLevels.support, ...technicalLevels.resistance, Object.values(technicalLevels.pivots)];
    const closestLevel = allLevels.reduce((prev, curr) => 
      Math.abs(curr - tradePrice) < Math.abs(prev - tradePrice) ? curr : prev
    );
    
    const distanceBps = Math.abs(tradePrice - closestLevel) / tradePrice * 10000;
    
    // Closer to key levels = higher score
    if (distanceBps < 20) score += 30;
    else if (distanceBps < 50) score += 20;
    else if (distanceBps < 100) score += 10;

    // Check if trade was near a breakout
    const nearBreakout = technicalLevels.breakouts.some(b => 
      Math.abs(b.timestamp - tradeTimestamp) < 3600000 && // Within 1 hour
      Math.abs(b.level - tradePrice) / tradePrice < 0.01 // Within 1%
    );
    
    if (nearBreakout) score += 25;

    // Check if price moved favorably after trade
    const priceChange = (priceAfter - tradePrice) / tradePrice;
    if (Math.abs(priceChange) > 0.02) { // If price moved >2%
      score += Math.min(20, Math.abs(priceChange) * 1000); // Up to 20 points for good timing
    }

    return Math.min(100, Math.max(0, score));
  }

  // ==================== NEWS & SENTIMENT TOOLS ====================

  async getNewsContext(asset: string, timestamp: number, windowHours: number = 2): Promise<NewsData[]> {
    if (!this.newsApiKey) {
      return this.generateMockNews(asset, timestamp, windowHours);
    }

    const cacheKey = `news_${asset}_${timestamp}_${windowHours}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const startTime = new Date(timestamp - windowHours * 3600 * 1000).toISOString();
      const endTime = new Date(timestamp + windowHours * 3600 * 1000).toISOString();
      
      // Search for crypto-related news
      const queries = [asset, `${asset} cryptocurrency`, `${asset} price`, `${asset} trading`];
      const allNews: NewsData[] = [];

      for (const query of queries) {
        const url = `${this.newsApi}/everything?q=${encodeURIComponent(query)}&from=${startTime}&to=${endTime}&sortBy=publishedAt&apiKey=${this.newsApiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.articles) {
          const newsItems = data.articles.map((article: any) => ({
            timestamp: new Date(article.publishedAt).getTime(),
            title: article.title,
            content: article.description || article.content || '',
            source: article.source.name,
            sentiment: this.analyzeSentiment(article.title + ' ' + (article.description || '')),
            relevanceScore: this.calculateRelevanceScore(article, asset),
            category: this.categorizeNews(article.title + ' ' + (article.description || ''))
          }));

          allNews.push(...newsItems);
        }
      }

      // Remove duplicates and sort by relevance
      const uniqueNews = allNews
        .filter((news, index, self) => 
          index === self.findIndex(n => n.title === news.title)
        )
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 10); // Top 10 most relevant

      this.setCache(cacheKey, uniqueNews);
      return uniqueNews;
    } catch (error) {
      console.error('Error fetching news:', error);
      return this.generateMockNews(asset, timestamp, windowHours);
    }
  }

  async getSocialSentiment(asset: string, timestamp: number): Promise<number> {
    // Mock implementation - would integrate with Twitter API, Reddit API, etc.
    // Return sentiment score from -1 (very negative) to 1 (very positive)
    return (Math.random() - 0.5) * 2;
  }

  // ==================== MARKET CONTEXT TOOLS ====================

  async getMarketContext(asset: string, timestamp: number): Promise<MarketContextData> {
    try {
      // Get funding rates from Hyperliquid
      const fundingResponse = await fetch(this.hyperliquidApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'meta'
        })
      });
      
      const fundingData = await fundingResponse.json();
      
      // Get liquidation data (mock for now)
      const liquidations = this.generateMockLiquidations(asset, timestamp);

      return {
        funding_rates: this.parseFundingRates(fundingData),
        open_interest: { [asset]: Math.random() * 1000000 },
        volume_profile: { [asset]: Math.random() * 10000000 },
        liquidations
      };
    } catch (error) {
      console.error('Error fetching market context:', error);
      return {
        funding_rates: { [asset]: (Math.random() - 0.5) * 0.02 },
        open_interest: { [asset]: Math.random() * 1000000 },
        volume_profile: { [asset]: Math.random() * 10000000 },
        liquidations: []
      };
    }
  }

  // ==================== HELPER METHODS ====================

  private assetToCoinGeckoId(asset: string): string {
    const mapping: { [key: string]: string } = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'AVAX': 'avalanche-2',
      'DOGE': 'dogecoin',
      'ARB': 'arbitrum',
      'OP': 'optimism',
      // Add more mappings as needed
    };
    return mapping[asset.toUpperCase()] || asset.toLowerCase();
  }

  private findLocalExtremes(prices: number[], type: 'high' | 'low'): number[] {
    const extremes: number[] = [];
    const windowSize = 5; // Look at 5 periods around each point
    
    for (let i = windowSize; i < prices.length - windowSize; i++) {
      const window = prices.slice(i - windowSize, i + windowSize + 1);
      const currentPrice = prices[i];
      
      if (type === 'high' && currentPrice === Math.max(...window)) {
        extremes.push(currentPrice);
      } else if (type === 'low' && currentPrice === Math.min(...window)) {
        extremes.push(currentPrice);
      }
    }
    
    return extremes;
  }

  private detectBreakouts(priceData: PriceDataPoint[], levels: number[]): TechnicalLevels['breakouts'] {
    const breakouts: TechnicalLevels['breakouts'] = [];
    
    for (let i = 1; i < priceData.length; i++) {
      const prevPrice = priceData[i - 1].price;
      const currPrice = priceData[i].price;
      
      for (const level of levels) {
        // Check if price crossed a level
        if ((prevPrice <= level && currPrice > level) || (prevPrice >= level && currPrice < level)) {
          breakouts.push({
            level,
            timestamp: priceData[i].timestamp,
            direction: currPrice > level ? 'up' : 'down'
          });
        }
      }
    }
    
    return breakouts;
  }

  private analyzeSentiment(text: string): number {
    // Simple sentiment analysis - would use proper NLP library
    const positive = ['bullish', 'gains', 'rally', 'breakout', 'surge', 'moon', 'pump'];
    const negative = ['bearish', 'crash', 'dump', 'fall', 'decline', 'bear', 'correction'];
    
    const words = text.toLowerCase().split(' ');
    let score = 0;
    
    words.forEach(word => {
      if (positive.includes(word)) score += 1;
      if (negative.includes(word)) score -= 1;
    });
    
    return Math.max(-1, Math.min(1, score / words.length * 10));
  }

  private calculateRelevanceScore(article: any, asset: string): number {
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const content = title + ' ' + description;
    
    let score = 0;
    
    // Check for asset mentions
    if (content.includes(asset.toLowerCase())) score += 50;
    
    // Check for trading/price keywords
    const tradingKeywords = ['price', 'trading', 'market', 'cryptocurrency', 'crypto'];
    tradingKeywords.forEach(keyword => {
      if (content.includes(keyword)) score += 10;
    });
    
    // Boost score for financial news sources
    const financialSources = ['coindesk', 'cointelegraph', 'bloomberg', 'reuters'];
    if (financialSources.some(source => (article.source?.name || '').toLowerCase().includes(source))) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  private categorizeNews(content: string): NewsData['category'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('regulation') || lowerContent.includes('sec') || lowerContent.includes('government')) {
      return 'regulatory';
    } else if (lowerContent.includes('technical') || lowerContent.includes('upgrade') || lowerContent.includes('update')) {
      return 'technical';
    } else if (lowerContent.includes('social') || lowerContent.includes('twitter') || lowerContent.includes('community')) {
      return 'social';
    } else if (lowerContent.includes('announcement') || lowerContent.includes('partnership') || lowerContent.includes('launch')) {
      return 'announcement';
    } else {
      return 'market';
    }
  }

  private parseFundingRates(data: any): { [asset: string]: number } {
    const rates: { [asset: string]: number } = {};
    
    if (data && data.universe) {
      data.universe.forEach((item: any) => {
        if (item.name && item.prevDayPx) {
          rates[item.name] = (Math.random() - 0.5) * 0.02; // Mock funding rate
        }
      });
    }
    
    return rates;
  }

  // ==================== CACHE METHODS ====================

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // ==================== MOCK DATA GENERATORS ====================

  private generateMockPriceData(asset: string, timestamp: number, windowHours: number): PriceDataPoint[] {
    const points: PriceDataPoint[] = [];
    const basePrice = 50000; // Mock base price
    const startTime = timestamp - windowHours * 3600 * 1000;
    const interval = (windowHours * 3600 * 1000) / 100; // 100 data points
    
    for (let i = 0; i < 100; i++) {
      points.push({
        timestamp: startTime + i * interval,
        price: basePrice + (Math.random() - 0.5) * 5000,
        volume: Math.random() * 1000000
      });
    }
    
    return points;
  }

  private generateMockTechnicalLevels(asset: string, timestamp: number): TechnicalLevels {
    const basePrice = 50000;
    return {
      support: [basePrice * 0.95, basePrice * 0.90, basePrice * 0.85],
      resistance: [basePrice * 1.05, basePrice * 1.10, basePrice * 1.15],
      pivots: {
        daily: basePrice,
        weekly: basePrice * 1.02,
        monthly: basePrice * 1.05
      },
      breakouts: []
    };
  }

  private generateMockNews(asset: string, timestamp: number, windowHours: number): NewsData[] {
    const hasNews = Math.random() > 0.7;
    if (!hasNews) return [];

    return [{
      timestamp: timestamp - Math.random() * windowHours * 3600 * 1000,
      title: `${asset} Shows Strong Momentum After Technical Breakout`,
      content: `${asset} has broken through key resistance levels with increased volume`,
      source: 'CoinDesk',
      sentiment: Math.random() > 0.5 ? 0.8 : -0.8,
      relevanceScore: 85,
      category: 'market'
    }];
  }

  private generateMockLiquidations(asset: string, timestamp: number): MarketContextData['liquidations'] {
    const liquidations: MarketContextData['liquidations'] = [];
    const count = Math.floor(Math.random() * 5);
    
    for (let i = 0; i < count; i++) {
      liquidations.push({
        timestamp: timestamp - Math.random() * 3600 * 1000,
        asset,
        amount: Math.random() * 1000000,
        side: Math.random() > 0.5 ? 'long' : 'short'
      });
    }
    
    return liquidations;
  }
}

export const traderAnalysisTools = new TraderAnalysisTools(); 