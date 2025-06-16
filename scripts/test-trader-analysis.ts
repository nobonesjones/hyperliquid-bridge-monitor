import { traderAnalysisAgent } from '../lib/services/trader-analysis-agent';

// Test the trader analysis system
async function testTraderAnalysis() {
  console.log('🚀 Testing Trader Analysis Agent System');
  console.log('=====================================\n');

  // Example trader wallet address (you'd use real ones)
  const testWalletAddress = '0x742d35Cc6634C0532925a3b8D214F8b6e2c9D2B0';
  
  try {
    console.log(`📊 Analyzing trader: ${testWalletAddress}`);
    console.log('⏱️  This may take a few minutes to gather all context data...\n');

    // Run the full analysis
    const analysis = await traderAnalysisAgent.analyzeTrader(testWalletAddress, 50);
    
    console.log('✅ Analysis Complete!');
    console.log('====================\n');

    // Display summary results
    console.log('📈 TRADER GRADE SUMMARY:');
    console.log(`  Skill Score: ${analysis.overallGrade.skillScore}/100`);
    console.log(`  Alpha Score: ${analysis.overallGrade.alphaScore}/100`);
    console.log(`  Risk Score: ${analysis.overallGrade.riskScore}/100`);
    console.log(`  Classification: ${analysis.overallGrade.classification}`);
    console.log(`  Insider Risk: ${analysis.overallGrade.insiderRisk}`);
    console.log(`  Copy Worthiness: ${analysis.overallGrade.copyWorthiness}/10\n`);

    console.log('🎯 KEY PATTERNS:');
    console.log(`  News Anticipation: ${analysis.patterns.newsAnticipation}%`);
    console.log(`  Pivot Accuracy: ${analysis.patterns.pivotAccuracy}%`);
    console.log(`  Breakout Timing: ${analysis.patterns.breakoutTiming}%`);
    console.log(`  Risk Management: ${analysis.patterns.riskManagement}%`);
    console.log(`  Consistency: ${analysis.patterns.consistencyScore}%\n`);

    // Show sample trades with context
    console.log('📋 SAMPLE TRADES WITH FULL CONTEXT:');
    console.log('===================================\n');

    analysis.trades.slice(0, 3).forEach((trade, index) => {
      console.log(`🔍 TRADE ${index + 1}: ${trade.asset} ${trade.side.toUpperCase()}`);
      console.log(`  ⏰ Time: ${new Date(trade.timestamp).toLocaleString()}`);
      console.log(`  💰 Price: $${trade.price.toFixed(2)}`);
      console.log(`  📊 Size: ${trade.size}`);
      console.log(`  📈 Direction: ${trade.direction}`);
      console.log(`  💵 PnL: ${trade.pnl ? `$${trade.pnl}` : 'N/A'}\n`);
      
      console.log(`  📊 PRICE CONTEXT:`);
      console.log(`    Before (1h): $${trade.context.priceAction.price1hBefore.toFixed(2)}`);
      console.log(`    After (1h): $${trade.context.priceAction.price1hAfter.toFixed(2)}`);
      console.log(`    After (24h): $${trade.context.priceAction.price24hAfter.toFixed(2)}`);
      console.log(`    Daily Range: $${trade.context.priceAction.dailyHighLow.low.toFixed(2)} - $${trade.context.priceAction.dailyHighLow.high.toFixed(2)}\n`);
      
      console.log(`  🎯 TECHNICAL ANALYSIS:`);
      console.log(`    Trend: ${trade.context.marketStructure.trendDirection}`);
      console.log(`    Volatility: ${trade.context.marketStructure.volatilityPercentile.toFixed(1)}%`);
      console.log(`    Pivot Distance: ${trade.context.timingAnalysis.pivotProximity.toFixed(1)} bps`);
      console.log(`    Breakout Timing: ${trade.context.timingAnalysis.breakoutTiming ? '✅ YES' : '❌ NO'}`);
      console.log(`    Technical Score: ${trade.context.timingAnalysis.technicalScore}/100\n`);
      
      console.log(`  📰 NEWS CONTEXT:`);
      console.log(`    Relevant News: ${trade.context.newsContext.cryptoNews.length} items`);
      if (trade.context.newsContext.cryptoNews.length > 0) {
        trade.context.newsContext.cryptoNews.forEach(news => {
          const timeDiff = Math.round((trade.timestamp - news.timestamp) / 60000);
          console.log(`      • ${news.title} (${timeDiff} min before)`);
        });
      }
      console.log(`    Social Sentiment: ${trade.context.newsContext.socialSentiment.toFixed(2)}`);
      console.log(`    Whale Activity: ${trade.context.newsContext.whaleActivity ? '🐋 YES' : '❌ NO'}\n`);
      
      console.log(`  ⭐ QUALITY SCORES:`);
      console.log(`    Timing: ${trade.analysis.timingQuality}/100`);
      console.log(`    News Correlation: ${trade.analysis.newsCorrelation}/100`);
      console.log(`    Technical Accuracy: ${trade.analysis.technicalAccuracy}/100`);
      console.log(`    Risk Assessment: ${trade.analysis.riskAssessment}/100`);
      console.log('  ' + '─'.repeat(50) + '\n');
    });

    // Generate the LLM prompt
    console.log('🤖 GENERATING LLM ANALYSIS PROMPT:');
    console.log('==================================\n');
    
    const llmPrompt = traderAnalysisAgent.generateLLMPrompt(analysis);
    console.log('📝 LLM Prompt Generated:');
    console.log(`   Length: ${llmPrompt.length} characters`);
    console.log(`   Trades Analyzed: ${analysis.trades.length}`);
    console.log('   Ready to send to LLM for comprehensive analysis!\n');

    // Show sample of the prompt
    console.log('📋 PROMPT PREVIEW (first 500 chars):');
    console.log('─'.repeat(50));
    console.log(llmPrompt.substring(0, 500) + '...\n');

    console.log('🎉 SYSTEM READY FOR PRODUCTION!');
    console.log('================================');
    console.log('✅ Raw trade data collected');
    console.log('✅ Price context enriched');
    console.log('✅ Technical analysis completed');
    console.log('✅ News correlation analyzed');
    console.log('✅ Market structure evaluated');
    console.log('✅ LLM prompt generated');
    console.log('\n🚀 Next Steps:');
    console.log('1. Send the generated prompt to your LLM');
    console.log('2. Get comprehensive trader analysis');
    console.log('3. Use the grading to identify alpha traders');
    console.log('4. Build your copy-trading strategy!\n');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

// Test multiple traders
async function testMultipleTraders() {
  console.log('🔄 Testing Multiple Traders');
  console.log('===========================\n');

  const testWallets = [
    '0x742d35Cc6634C0532925a3b8D214F8b6e2c9D2B0',
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xabcdef1234567890abcdef1234567890abcdef12'
  ];

  const results = [];

  for (const wallet of testWallets) {
    try {
      console.log(`📊 Analyzing ${wallet.substring(0, 10)}...`);
      const analysis = await traderAnalysisAgent.analyzeTrader(wallet, 25);
      results.push(analysis);
      
      console.log(`✅ Complete - Grade: ${analysis.overallGrade.skillScore}/100`);
    } catch (error) {
      console.error(`❌ Failed to analyze ${wallet}:`, error);
    }
  }

  // Rank traders
  console.log('\n🏆 TRADER RANKINGS:');
  console.log('==================');

  const ranked = results.sort((a, b) => b.overallGrade.skillScore - a.overallGrade.skillScore);
  
  ranked.forEach((trader, index) => {
    console.log(`${index + 1}. ${trader.walletAddress.substring(0, 10)}...`);
    console.log(`   Skill: ${trader.overallGrade.skillScore}/100`);
    console.log(`   Alpha: ${trader.overallGrade.alphaScore}/100`);
    console.log(`   Type: ${trader.overallGrade.classification}`);
    console.log(`   Copy Worth: ${trader.overallGrade.copyWorthiness}/10\n`);
  });
}

// Run the tests
if (require.main === module) {
  testTraderAnalysis()
    .then(() => testMultipleTraders())
    .catch(console.error);
}

export { testTraderAnalysis, testMultipleTraders }; 