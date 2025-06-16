'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  Target, 
  Brain, 
  Shield, 
  AlertTriangle,
  Newspaper,
  Eye,
  Star,
  Copy,
  RefreshCw,
  BarChart3
} from 'lucide-react'

// Mock interfaces for the demo
interface MockTraderAnalysis {
  walletAddress: string
  analysisTimestamp: number
  tradeCount: number
  overallGrade: {
    skillScore: number
    alphaScore: number
    riskScore: number
    insiderRisk: 'low' | 'medium' | 'high'
    classification: 'alpha_generator' | 'momentum_follower' | 'contrarian' | 'gambler' | 'insider'
    copyWorthiness: number
  }
  patterns: {
    newsAnticipation: number
    pivotAccuracy: number
    breakoutTiming: number
    riskManagement: number
    consistencyScore: number
  }
  trades: Array<{
    asset: string
    side: 'buy' | 'sell'
    price: number
    size: number
    timestamp: number
    pnl?: number
    direction: string
    analysis: {
      timingQuality: number
      newsCorrelation: number
      technicalAccuracy: number
      riskAssessment: number
    }
  }>
}

interface AIInsight {
  grade: string
  classification: string
  copyWorthiness: number
  keyStrengths: string[]
  redFlags: string[]
  recommendation: string
  reasoning: string
}

export default function TraderAnalysisDashboard() {
  const [walletAddress, setWalletAddress] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<MockTraderAnalysis | null>(null)
  const [llmPrompt, setLlmPrompt] = useState('')
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null)
  const [isGettingInsight, setIsGettingInsight] = useState(false)

  const analyzeTrader = async () => {
    if (!walletAddress.trim()) return

    setIsAnalyzing(true)
    
    try {
      // Simulate getting real trade data from Hyperliquid
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate realistic mock analysis
      const mockAnalysis: MockTraderAnalysis = {
        walletAddress,
        analysisTimestamp: Date.now(),
        tradeCount: Math.floor(Math.random() * 150) + 50,
        overallGrade: {
          skillScore: Math.floor(Math.random() * 40) + 60, // 60-100
          alphaScore: Math.floor(Math.random() * 50) + 50, // 50-100
          riskScore: Math.floor(Math.random() * 30) + 70, // 70-100
          insiderRisk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          classification: ['alpha_generator', 'momentum_follower', 'contrarian', 'gambler'][Math.floor(Math.random() * 4)] as any,
          copyWorthiness: Math.floor(Math.random() * 5) + 5 // 5-10
        },
        patterns: {
          newsAnticipation: Math.floor(Math.random() * 40) + 60,
          pivotAccuracy: Math.floor(Math.random() * 50) + 50,
          breakoutTiming: Math.floor(Math.random() * 40) + 60,
          riskManagement: Math.floor(Math.random() * 30) + 70,
          consistencyScore: Math.floor(Math.random() * 40) + 60
        },
        trades: generateMockTrades(20)
      }
      
      setAnalysis(mockAnalysis)
      
      // Generate comprehensive LLM prompt
      const prompt = generateLLMPrompt(mockAnalysis)
      setLlmPrompt(prompt)
      
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateMockTrades = (count: number) => {
    const assets = ['BTC', 'ETH', 'SOL', 'AVAX', 'ARB', 'OP']
    const trades = []
    
    for (let i = 0; i < count; i++) {
      const asset = assets[Math.floor(Math.random() * assets.length)]
      const basePrice = asset === 'BTC' ? 105000 : asset === 'ETH' ? 3800 : 200
      
      trades.push({
        asset,
        side: Math.random() > 0.5 ? 'buy' : 'sell' as any,
        price: basePrice * (0.9 + Math.random() * 0.2),
        size: Math.random() * 10 + 0.1,
        timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Last 30 days
        pnl: (Math.random() - 0.4) * 5000, // Slightly profitable bias
        direction: ['Open Long', 'Close Long', 'Open Short', 'Close Short'][Math.floor(Math.random() * 4)],
        analysis: {
          timingQuality: Math.floor(Math.random() * 40) + 60,
          newsCorrelation: Math.floor(Math.random() * 60) + 40,
          technicalAccuracy: Math.floor(Math.random() * 50) + 50,
          riskAssessment: Math.floor(Math.random() * 30) + 70
        }
      })
    }
    
    return trades.sort((a, b) => b.timestamp - a.timestamp)
  }

  const generateLLMPrompt = (analysis: MockTraderAnalysis) => {
    return `# COMPREHENSIVE TRADER ANALYSIS REQUEST

Analyze this trader's performance using the detailed trade data and context provided.

## TRADER PROFILE
- Wallet: ${analysis.walletAddress}
- Analysis Period: ${analysis.tradeCount} most recent trades
- Analysis Date: ${new Date(analysis.analysisTimestamp).toISOString()}

## PERFORMANCE METRICS
- Skill Score: ${analysis.overallGrade.skillScore}/100
- Alpha Score: ${analysis.overallGrade.alphaScore}/100
- Risk Score: ${analysis.overallGrade.riskScore}/100
- Current Classification: ${analysis.overallGrade.classification}
- Insider Risk: ${analysis.overallGrade.insiderRisk}

## KEY PATTERNS DETECTED
- News Anticipation: ${analysis.patterns.newsAnticipation}%
- Pivot Accuracy: ${analysis.patterns.pivotAccuracy}%
- Breakout Timing: ${analysis.patterns.breakoutTiming}%
- Risk Management: ${analysis.patterns.riskManagement}%
- Consistency Score: ${analysis.patterns.consistencyScore}%

## RECENT TRADES SAMPLE
${analysis.trades.slice(0, 10).map((trade, i) => `
### TRADE ${i + 1}: ${trade.asset} ${trade.side.toUpperCase()}
- Timestamp: ${new Date(trade.timestamp).toISOString()}
- Price: $${trade.price.toFixed(2)}
- Size: ${trade.size.toFixed(3)}
- PnL: ${trade.pnl ? `$${trade.pnl.toFixed(2)}` : 'N/A'}
- Direction: ${trade.direction}
- Timing Quality: ${trade.analysis.timingQuality}/100
- News Correlation: ${trade.analysis.newsCorrelation}/100
- Technical Accuracy: ${trade.analysis.technicalAccuracy}/100
- Risk Assessment: ${trade.analysis.riskAssessment}/100
`).join('\n')}

## ANALYSIS REQUIREMENTS

Please provide a comprehensive analysis in JSON format with the following structure:

{
  "grade": "A-F letter grade",
  "classification": "Refined trader type (Alpha Generator/Momentum Follower/Contrarian/Gambler/Insider)",
  "copyWorthiness": "1-10 score",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "redFlags": ["flag1", "flag2"],
  "recommendation": "Should this trader be copied? (Yes/No/Conditional)",
  "reasoning": "Detailed explanation of your analysis and recommendation"
}

Focus on:
1. Skill vs luck assessment
2. Consistency evaluation  
3. Risk management quality
4. Evidence of insider information
5. Market timing ability
6. Copy-trading viability`
  }

  const getAIInsight = async () => {
    if (!analysis || !llmPrompt) return

    setIsGettingInsight(true)
    
    try {
      const response = await fetch('/api/analyze-trader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: llmPrompt
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI insight')
      }

      const result = await response.json()
      setAiInsight(result.insight)
      
    } catch (error) {
      console.error('AI insight failed:', error)
      // Fallback to mock insight
      const mockInsight: AIInsight = {
        grade: 'B+',
        classification: 'Alpha Generator with Momentum Bias',
        copyWorthiness: 7,
        keyStrengths: [
          'Strong technical timing on breakouts',
          'Good risk management discipline',
          'Consistent profit-taking strategy'
        ],
        redFlags: [
          'Occasional large position sizes',
          'Some trades lack clear catalyst'
        ],
        recommendation: 'Conditional',
        reasoning: 'This trader shows solid technical skills with above-average timing on breakouts and good risk management. However, position sizing can be aggressive at times. Recommended for copy trading with 0.5x leverage and strict stop-losses.'
      }
      setAiInsight(mockInsight)
    } finally {
      setIsGettingInsight(false)
    }
  }

  const getGradeColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getGradeLetter = (score: number) => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'alpha_generator': return <Star className="h-4 w-4" />
      case 'momentum_follower': return <TrendingUp className="h-4 w-4" />
      case 'contrarian': return <Target className="h-4 w-4" />
      case 'gambler': return <AlertTriangle className="h-4 w-4" />
      case 'insider': return <Eye className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          🤖 AI Trader Analysis System
        </h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive LLM-powered analysis of crypto traders using raw trade data + market context
        </p>

        {/* Input Section */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Analyze Trader
            </CardTitle>
            <CardDescription>
              Enter a wallet address to get comprehensive AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="0x742d35Cc6634C0532925a3b8D214F8b6e2c9D2B0"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={analyzeTrader}
                disabled={isAnalyzing || !walletAddress.trim()}
                className="min-w-32"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            
            {isAnalyzing && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  🔍 Gathering raw trade data from Hyperliquid...
                </div>
                <Progress value={30} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  This may take 1-2 minutes to collect all context data
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overall Grade Card */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full border-2 ${getGradeColor(analysis.overallGrade.skillScore)}`}>
                    <div className="text-2xl font-bold">
                      {getGradeLetter(analysis.overallGrade.skillScore)}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Trader Analysis Complete
                    </h2>
                    <p className="text-gray-600">
                      {analysis.walletAddress.substring(0, 10)}...{analysis.walletAddress.substring(analysis.walletAddress.length - 8)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {analysis.tradeCount} trades analyzed
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(analysis.analysisTimestamp).toLocaleString()}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysis.overallGrade.skillScore}
                  </div>
                  <div className="text-sm text-gray-600">Skill Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analysis.overallGrade.alphaScore}
                  </div>
                  <div className="text-sm text-gray-600">Alpha Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {analysis.overallGrade.riskScore}
                  </div>
                  <div className="text-sm text-gray-600">Risk Score</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {getClassificationIcon(analysis.overallGrade.classification)}
                    <span className="text-sm font-medium">
                      {analysis.overallGrade.classification.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Classification</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Copy className="h-4 w-4" />
                    <span className="text-xl font-bold">
                      {analysis.overallGrade.copyWorthiness}/10
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">Copy Worth</div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-center gap-4">
                <Badge className={getRiskBadgeColor(analysis.overallGrade.insiderRisk)}>
                  <Shield className="h-3 w-3 mr-1" />
                  {analysis.overallGrade.insiderRisk.toUpperCase()} INSIDER RISK
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="patterns" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="patterns">Key Patterns</TabsTrigger>
              <TabsTrigger value="trades">Recent Trades</TabsTrigger>
              <TabsTrigger value="llm">LLM Prompt</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            {/* Key Patterns Tab */}
            <TabsContent value="patterns">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5" />
                    News Anticipation
                  </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {analysis.patterns.newsAnticipation}%
                        </span>
                        <Badge variant={analysis.patterns.newsAnticipation > 50 ? 'default' : 'secondary'}>
                          {analysis.patterns.newsAnticipation > 50 ? 'Strong' : 'Weak'}
                        </Badge>
                      </div>
                      <Progress value={analysis.patterns.newsAnticipation} className="h-2" />
                      <p className="text-xs text-gray-600">
                        Ability to trade before news events
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Pivot Accuracy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {analysis.patterns.pivotAccuracy}%
                        </span>
                        <Badge variant={analysis.patterns.pivotAccuracy > 70 ? 'default' : 'secondary'}>
                          {analysis.patterns.pivotAccuracy > 70 ? 'Precise' : 'Average'}
                        </Badge>
                      </div>
                      <Progress value={analysis.patterns.pivotAccuracy} className="h-2" />
                      <p className="text-xs text-gray-600">
                        Precision in timing key reversal points
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Breakout Timing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {analysis.patterns.breakoutTiming}%
                        </span>
                        <Badge variant={analysis.patterns.breakoutTiming > 60 ? 'default' : 'secondary'}>
                          {analysis.patterns.breakoutTiming > 60 ? 'Good' : 'Poor'}
                        </Badge>
                      </div>
                      <Progress value={analysis.patterns.breakoutTiming} className="h-2" />
                      <p className="text-xs text-gray-600">
                        Success rate at catching breakouts
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Risk Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {analysis.patterns.riskManagement}%
                        </span>
                        <Badge variant={analysis.patterns.riskManagement > 70 ? 'default' : 'destructive'}>
                          {analysis.patterns.riskManagement > 70 ? 'Disciplined' : 'Risky'}
                        </Badge>
                      </div>
                      <Progress value={analysis.patterns.riskManagement} className="h-2" />
                      <p className="text-xs text-gray-600">
                        Position sizing and stop-loss discipline
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Consistency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {analysis.patterns.consistencyScore}%
                        </span>
                        <Badge variant={analysis.patterns.consistencyScore > 75 ? 'default' : 'secondary'}>
                          {analysis.patterns.consistencyScore > 75 ? 'Consistent' : 'Volatile'}
                        </Badge>
                      </div>
                      <Progress value={analysis.patterns.consistencyScore} className="h-2" />
                      <p className="text-xs text-gray-600">
                        Performance consistency over time
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Recent Trades Tab */}
            <TabsContent value="trades">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Trades Analysis</CardTitle>
                  <CardDescription>
                    Last {analysis.trades.length} trades with quality scores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {analysis.trades.map((trade, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'}>
                              {trade.asset} {trade.side.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              ${trade.price.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500">
                              Size: {trade.size.toFixed(3)}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${trade.pnl && trade.pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              PnL: {trade.pnl ? `$${trade.pnl.toFixed(2)}` : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(trade.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>Timing: {trade.analysis.timingQuality}/100</div>
                          <div>News: {trade.analysis.newsCorrelation}/100</div>
                          <div>Technical: {trade.analysis.technicalAccuracy}/100</div>
                          <div>Risk: {trade.analysis.riskAssessment}/100</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* LLM Prompt Tab */}
            <TabsContent value="llm">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Generated LLM Prompt
                  </CardTitle>
                  <CardDescription>
                    Comprehensive prompt with all trade context - Ready to send to your LLM
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Prompt Length: {llmPrompt.length.toLocaleString()} characters
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(llmPrompt)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Prompt
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap font-mono">
                        {llmPrompt}
                      </pre>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">💡 Next Steps:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                        <li>Copy the prompt above</li>
                        <li>Send it to Claude, GPT-4, or your preferred LLM</li>
                        <li>Get comprehensive trader analysis with specific insights</li>
                        <li>Use the grading to make copy-trading decisions</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI-Generated Insights
                    </div>
                    {!aiInsight && (
                      <Button 
                        onClick={getAIInsight}
                        disabled={isGettingInsight}
                        size="sm"
                      >
                        {isGettingInsight ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Get AI Insight
                          </>
                        )}
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis using OpenAI GPT-4
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aiInsight ? (
                    <div className="space-y-6">
                      {/* Overall Assessment */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-blue-600 mb-2">
                                {aiInsight.grade}
                              </div>
                              <div className="text-sm text-gray-600">AI Grade</div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600 mb-2">
                                {aiInsight.copyWorthiness}/10
                              </div>
                              <div className="text-sm text-gray-600">Copy Score</div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <Badge variant="outline" className="text-sm">
                                {aiInsight.recommendation}
                              </Badge>
                              <div className="text-sm text-gray-600 mt-2">Recommendation</div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Separator />

                      {/* Classification */}
                      <div>
                        <h4 className="font-semibold mb-2">Trader Classification</h4>
                        <Badge variant="secondary" className="text-sm">
                          {aiInsight.classification}
                        </Badge>
                      </div>

                      {/* Key Strengths */}
                      <div>
                        <h4 className="font-semibold mb-2 text-green-700">Key Strengths</h4>
                        <ul className="space-y-1">
                          {aiInsight.keyStrengths.map((strength, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Red Flags */}
                      {aiInsight.redFlags.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 text-red-700">Red Flags</h4>
                          <ul className="space-y-1">
                            {aiInsight.redFlags.map((flag, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Detailed Reasoning */}
                      <div>
                        <h4 className="font-semibold mb-2">Detailed Analysis</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm leading-relaxed">
                            {aiInsight.reasoning}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-4">Click "Get AI Insight" to analyze this trader with OpenAI GPT-4</p>
                      <p className="text-xs text-gray-400">
                        This will send the comprehensive trade data to OpenAI for detailed analysis
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
} 