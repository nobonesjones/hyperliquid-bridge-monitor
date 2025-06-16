export interface TradeData {
  timestamp: number;
  asset: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  pnl?: number;
  fee: number;
  orderId: string;
  direction: string; // e.g., "Open Long", "Close Short"
}

export interface TradeContext {
  priceAction: {
    entryPrice: number;
    price1hBefore: number;
    price1hAfter: number;
    price24hAfter: number;
    price1wAfter: number;
    dailyHighLow: { high: number; low: number };
    volumeContext: number;
  };
  marketStructure: {
    supportResistance: { support: number[]; resistance: number[] };
    trendDirection: 'uptrend' | 'downtrend' | 'sideways';
    volatilityPercentile: number;
    fundingRate?: number;
  };
  timingAnalysis: {
    pivotProximity: number; // Distance to nearest pivot
    breakoutTiming: boolean;
    reversalTiming: boolean;
    technicalScore: number; // 0-100 score for timing quality
  };
  newsContext: {
    cryptoNews: NewsItem[];
    assetSpecific: NewsItem[];
    macroEvents: MacroEvent[];
    socialSentiment: number; // -1 to 1
    whaleActivity: boolean;
  };
}

export interface NewsItem {
  timestamp: number;
  title: string;
  content: string;
  source: string;
  sentiment: number;
  relevanceScore: number;
}

export interface MacroEvent {
  timestamp: number;
  event: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
}

export interface TraderAnalysis {
  walletAddress: string;
  analysisTimestamp: number;
  tradeCount: number;
  trades: TradeWithContext[];
  overallGrade: {
    skillScore: number; // 0-100
    alphaScore: number; // 0-100  
    riskScore: number; // 0-100
    insiderRisk: 'low' | 'medium' | 'high';
    classification: 'alpha_generator' | 'momentum_follower' | 'contrarian' | 'gambler' | 'insider';
    copyWorthiness: number; // 0-10
  };
  patterns: {
    newsAnticipation: number;
    pivotAccuracy: number;
    breakoutTiming: number;
    riskManagement: number;
    consistencyScore: number;
  };
}

export interface TradeWithContext extends TradeData {
  context: TradeContext;
  analysis: {
    timingQuality: number; // 0-100
    newsCorrelation: number; // 0-100
    technicalAccuracy: number; // 0-100
    riskAssessment: number; // 0-100
  };
}

class TraderAnalysisAgent {
  private hyperliquidApi: string = 'https://api.hyperliquid.xyz/info';
  private coingeckoApi: string = 'https://api.coingecko.com/api/v3';
  
  constructor() {
    console.log('🤖 Trader Analysis Agent initialized');
  }

  // Main analysis function
  async analyzeTrader(walletAddress: string, tradeCount: number = 100): Promise<TraderAnalysis> {
    console.log(`🔍 Analyzing trader: ${walletAddress}`);
    
    // Step 1: Get raw trade data
    const rawTrades = await this.getRawTrades(walletAddress, tradeCount);
    
    // Step 2: Enrich each trade with context
    const tradesWithContext = await this.enrichTradesWithContext(rawTrades);
    
    // Step 3: Generate LLM analysis
    const analysis = await this.generateLLMAnalysis(tradesWithContext);
    
    return {
      walletAddress,
      analysisTimestamp: Date.now(),
      tradeCount: rawTrades.length,
      trades: tradesWithContext,
      overallGrade: analysis.grade,
      patterns: analysis.patterns
    };
  }

  // Get raw trades from Hyperliquid API
  private async getRawTrades(walletAddress: string, limit: number): Promise<TradeData[]> {
    try {
      const response = await fetch(this.hyperliquidApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'userFills',
          user: walletAddress
        })
      });

      const data = await response.json();
      
      return data.slice(0, limit).map((fill: any) => ({
        timestamp: fill.time,
        asset: fill.coin,
        price: parseFloat(fill.px),
        size: parseFloat(fill.sz),
        side: fill.side === 'B' ? 'buy' : 'sell',
        pnl: fill.closedPnl ? parseFloat(fill.closedPnl) : undefined,
        fee: parseFloat(fill.fee || '0'),
        orderId: fill.oid.toString(),
        direction: fill.dir
      }));
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  }

  // Enrich trades with full context
  private async enrichTradesWithContext(trades: TradeData[]): Promise<TradeWithContext[]> {
    const enrichedTrades: TradeWithContext[] = [];
    
    for (const trade of trades) {
      console.log(`📊 Enriching trade: ${trade.asset} at ${new Date(trade.timestamp).toISOString()}`);
      
      const context = await this.getTradeContext(trade);
      const analysis = this.analyzeTradeQuality(trade, context);
      
      enrichedTrades.push({
        ...trade,
        context,
        analysis
      });
    }
    
    return enrichedTrades;
  }

  // Get comprehensive context for a single trade
  private async getTradeContext(trade: TradeData): Promise<TradeContext> {
    const [priceAction, marketStructure, timingAnalysis, newsContext] = await Promise.all([
      this.getPriceActionContext(trade),
      this.getMarketStructureContext(trade),
      this.getTimingAnalysis(trade),
      this.getNewsContext(trade)
    ]);

    return {
      priceAction,
      marketStructure, 
      timingAnalysis,
      newsContext
    };
  }

  // Price action analysis around trade time
  private async getPriceActionContext(trade: TradeData): Promise<TradeContext['priceAction']> {
    try {
      // For now, using mock data - would integrate with CoinGecko/TradingView
      const basePrice = trade.price;
      const volatility = 0.05; // 5% typical volatility
      
      return {
        entryPrice: trade.price,
        price1hBefore: basePrice * (1 + (Math.random() - 0.5) * volatility),
        price1hAfter: basePrice * (1 + (Math.random() - 0.5) * volatility),
        price24hAfter: basePrice * (1 + (Math.random() - 0.5) * volatility * 2),
        price1wAfter: basePrice * (1 + (Math.random() - 0.5) * volatility * 4),
        dailyHighLow: {
          high: basePrice * (1 + volatility * 0.8),
          low: basePrice * (1 - volatility * 0.8)
        },
        volumeContext: Math.random() * 1000000 // Mock volume
      };
    } catch (error) {
      console.error('Error getting price context:', error);
      throw error;
    }
  }

  // Market structure analysis
  private async getMarketStructureContext(trade: TradeData): Promise<TradeContext['marketStructure']> {
    // Mock implementation - would use technical analysis tools
    return {
      supportResistance: {
        support: [trade.price * 0.95, trade.price * 0.90],
        resistance: [trade.price * 1.05, trade.price * 1.10]
      },
      trendDirection: Math.random() > 0.5 ? 'uptrend' : 'downtrend',
      volatilityPercentile: Math.random() * 100,
      fundingRate: (Math.random() - 0.5) * 0.01 // -0.5% to +0.5%
    };
  }

  // Timing quality analysis
  private async getTimingAnalysis(trade: TradeData): Promise<TradeContext['timingAnalysis']> {
    const pivotDistance = Math.random() * 100; // Distance to nearest pivot in basis points
    
    return {
      pivotProximity: pivotDistance,
      breakoutTiming: pivotDistance < 20, // Within 20bps of pivot
      reversalTiming: pivotDistance < 50, // Within 50bps of reversal
      technicalScore: Math.max(0, 100 - pivotDistance) // Score based on proximity
    };
  }

  // News and sentiment context
  private async getNewsContext(trade: TradeData): Promise<TradeContext['newsContext']> {
    // Mock implementation - would integrate with news APIs
    const hasNews = Math.random() > 0.7; // 30% of trades have relevant news
    
    return {
      cryptoNews: hasNews ? [{
        timestamp: trade.timestamp - 1800000, // 30 min before
        title: `${trade.asset} Major Development Announced`,
        content: 'Significant news that could impact price',
        source: 'CoinDesk',
        sentiment: Math.random() > 0.5 ? 1 : -1,
        relevanceScore: Math.random() * 100
      }] : [],
      assetSpecific: [],
      macroEvents: [],
      socialSentiment: (Math.random() - 0.5) * 2, // -1 to 1
      whaleActivity: Math.random() > 0.8 // 20% chance of whale activity
    };
  }

  // Analyze individual trade quality
  private analyzeTradeQuality(trade: TradeData, context: TradeContext): TradeWithContext['analysis'] {
    const timingQuality = context.timingAnalysis.technicalScore;
    const newsCorrelation = context.newsContext.cryptoNews.length > 0 ? 80 : 20;
    const technicalAccuracy = context.timingAnalysis.breakoutTiming ? 90 : 50;
    const riskAssessment = trade.size / 1000; // Simple risk metric
    
    return {
      timingQuality,
      newsCorrelation,
      technicalAccuracy,
      riskAssessment: Math.min(100, riskAssessment)
    };
  }

  // Generate LLM analysis using enriched trade data
  private async generateLLMAnalysis(trades: TradeWithContext[]): Promise<{
    grade: TraderAnalysis['overallGrade'];
    patterns: TraderAnalysis['patterns'];
  }> {
    // This is where we'd send to LLM - for now returning mock analysis
    const avgTimingQuality = trades.reduce((sum, t) => sum + t.analysis.timingQuality, 0) / trades.length;
    const newsAnticipation = trades.filter(t => t.context.newsContext.cryptoNews.length > 0).length / trades.length;
    const pivotAccuracy = trades.filter(t => t.context.timingAnalysis.breakoutTiming).length / trades.length;
    
    return {
      grade: {
        skillScore: Math.round(avgTimingQuality),
        alphaScore: Math.round(newsAnticipation * 100),
        riskScore: Math.round(Math.random() * 100),
        insiderRisk: newsAnticipation > 0.3 ? 'high' : 'low',
        classification: avgTimingQuality > 70 ? 'alpha_generator' : 'momentum_follower',
        copyWorthiness: Math.round(avgTimingQuality / 10)
      },
      patterns: {
        newsAnticipation: Math.round(newsAnticipation * 100),
        pivotAccuracy: Math.round(pivotAccuracy * 100),
        breakoutTiming: Math.round(avgTimingQuality),
        riskManagement: Math.round(Math.random() * 100),
        consistencyScore: Math.round(Math.random() * 100)
      }
    };
  }

  // Generate comprehensive LLM prompt with all trade context
  generateLLMPrompt(analysis: TraderAnalysis): string {
    return `
# TRADER ANALYSIS REQUEST

Analyze this trader's performance using the detailed trade data and context provided.

## TRADER PROFILE
- Wallet: ${analysis.walletAddress}
- Analysis Period: ${analysis.tradeCount} most recent trades
- Analysis Date: ${new Date(analysis.analysisTimestamp).toISOString()}

## DETAILED TRADE DATA

${analysis.trades.slice(0, 20).map((trade, i) => `
### TRADE ${i + 1}: ${trade.asset} ${trade.side.toUpperCase()}
**Basic Data:**
- Timestamp: ${new Date(trade.timestamp).toISOString()}
- Price: $${trade.price.toFixed(2)}
- Size: ${trade.size}
- PnL: ${trade.pnl ? `$${trade.pnl}` : 'N/A'}
- Direction: ${trade.direction}

**Price Action Context:**
- Price 1h before: $${trade.context.priceAction.price1hBefore.toFixed(2)}
- Price 1h after: $${trade.context.priceAction.price1hAfter.toFixed(2)}
- Price 24h after: $${trade.context.priceAction.price24hAfter.toFixed(2)}
- Daily Range: $${trade.context.priceAction.dailyHighLow.low.toFixed(2)} - $${trade.context.priceAction.dailyHighLow.high.toFixed(2)}

**Market Structure:**
- Trend: ${trade.context.marketStructure.trendDirection}
- Volatility Percentile: ${trade.context.marketStructure.volatilityPercentile.toFixed(1)}%
- Support Levels: ${trade.context.marketStructure.supportResistance.support.map(s => `$${s.toFixed(2)}`).join(', ')}
- Resistance Levels: ${trade.context.marketStructure.supportResistance.resistance.map(r => `$${r.toFixed(2)}`).join(', ')}

**Timing Analysis:**
- Pivot Proximity: ${trade.context.timingAnalysis.pivotProximity.toFixed(1)} basis points
- Breakout Timing: ${trade.context.timingAnalysis.breakoutTiming ? 'YES' : 'NO'}
- Technical Score: ${trade.context.timingAnalysis.technicalScore.toFixed(1)}/100

**News Context:**
- Relevant News: ${trade.context.newsContext.cryptoNews.length} items
${trade.context.newsContext.cryptoNews.map(news => `  - ${news.title} (${Math.round((trade.timestamp - news.timestamp) / 60000)} min before trade)`).join('\n')}
- Social Sentiment: ${trade.context.newsContext.socialSentiment.toFixed(2)}
- Whale Activity: ${trade.context.newsContext.whaleActivity ? 'YES' : 'NO'}

**Quality Scores:**
- Timing Quality: ${trade.analysis.timingQuality}/100
- News Correlation: ${trade.analysis.newsCorrelation}/100
- Technical Accuracy: ${trade.analysis.technicalAccuracy}/100
- Risk Assessment: ${trade.analysis.riskAssessment}/100

`).join('\n')}

## ANALYSIS REQUIREMENTS

Please provide a comprehensive analysis covering:

1. **OVERALL PERFORMANCE GRADE (A-F)**
   - Skill vs Luck assessment
   - Consistency evaluation
   - Risk management quality

2. **TRADER CLASSIFICATION**
   - Alpha Generator vs Momentum Follower vs Gambler
   - Insider Risk Level (Low/Medium/High)
   - Primary trading strategy identification

3. **KEY PATTERNS IDENTIFIED**
   - News anticipation ability
   - Technical timing accuracy
   - Pivot point precision
   - Breakout/reversal timing
   - Risk management discipline

4. **COPY-WORTHINESS SCORE (1-10)**
   - Factors supporting the score
   - Risk considerations
   - Recommended position sizing if copying

5. **SPECIFIC INSIGHTS**
   - Most impressive trades and why
   - Red flags or concerning patterns
   - Market conditions where trader excels/struggles
   - Evidence of insider information or exceptional skill

6. **FINAL RECOMMENDATION**
   - Should this trader be followed/copied?
   - What can be learned from their approach?
   - Risk warnings and considerations

Please be specific and reference actual trades from the data when making points.
`;
  }
}

export const traderAnalysisAgent = new TraderAnalysisAgent(); 