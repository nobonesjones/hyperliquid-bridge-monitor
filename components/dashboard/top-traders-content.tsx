'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronDown, ChevronRight, RefreshCw, Plus, TrendingUp, TrendingDown 
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatPercentage, cn } from '@/lib/utils'
import { hyperliquidAPI } from '@/lib/services/hyperliquid'
import { useToast } from "@/components/ui/use-toast"
import { CumulativePerformanceChart } from '@/components/ui/cumulative-performance-chart'

interface Position {
  coin: string
  side: 'long' | 'short'
  sizeUSD: number
  entryPrice: number
  markPrice: number
  unrealizedPnl: number
  leverage: number
  liquidationPrice: number
  margin: number
  returnOnEquity: number
}

interface TraderData {
  address: string
  name?: string
  perpEquity: number
  mainPosition?: {
    coin: string
    side: 'long' | 'short'
    sizeUSD: number
  }
  directionBias: {
    percentage: number
    isLong: boolean
  }
  dailyPnl: {
    amount: number
    percentage: number
  }
  weeklyPnl: {
    amount: number
    percentage: number
  }
  monthlyPnl: {
    amount: number
    percentage: number
  }
  allTimePnl: {
    amount: number
    percentage: number
  }
  positions: Position[]
  isLoading: boolean
  error?: string
}

export default function TopTradersContent() {
  const [traders, setTraders] = useState<TraderData[]>([])
  const [expandedTraders, setExpandedTraders] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('24H')
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const fetchTraders = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: traderAddresses, error } = await supabase
        .from('top_traders')
        .select('address, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching traders:', error)
        return
      }

      const tradersWithData = traderAddresses?.map(trader => ({
        address: trader.address,
        name: trader.name,
        perpEquity: 0,
        directionBias: { percentage: 0, isLong: true },
        dailyPnl: { amount: 0, percentage: 0 },
        weeklyPnl: { amount: 0, percentage: 0 },
        monthlyPnl: { amount: 0, percentage: 0 },
        allTimePnl: { amount: 0, percentage: 0 },
        positions: [],
        isLoading: true
      })) || []

      setTraders(tradersWithData)

      for (const trader of tradersWithData) {
        fetchTraderData(trader.address)
      }
    } catch (error) {
      console.error('Error fetching traders:', error)
    }
  }, [supabase])

  const fetchTraderData = async (address: string) => {
    try {
      const data = await hyperliquidAPI.getWalletPositions(address)
      
      const longCount = data.positions.filter(pos => pos.side === 'long').length
      const shortCount = data.positions.filter(pos => pos.side === 'short').length
      const totalPositions = data.positions.length
      
      let directionBias = { percentage: 0, isLong: true }
      if (totalPositions > 0) {
        if (longCount >= shortCount) {
          directionBias = { percentage: (longCount / totalPositions) * 100, isLong: true }
        } else {
          directionBias = { percentage: (shortCount / totalPositions) * 100, isLong: false }
        }
      }

      let mainPosition = undefined
      if (data.positions.length > 0) {
        const largestPosition = data.positions.reduce((prev, current) => 
          prev.sizeUSD > current.sizeUSD ? prev : current
        )
        mainPosition = {
          coin: largestPosition.coin,
          side: largestPosition.side,
          sizeUSD: largestPosition.sizeUSD
        }
      }

      const mockPnl = {
        dailyPnl: { 
          amount: Math.random() * 200000 - 100000, 
          percentage: Math.random() * 20 - 10 
        },
        weeklyPnl: { 
          amount: Math.random() * 500000 - 250000, 
          percentage: Math.random() * 50 - 25 
        },
        monthlyPnl: { 
          amount: Math.random() * 1000000 - 500000, 
          percentage: Math.random() * 100 - 50 
        },
        allTimePnl: { 
          amount: Math.random() * 5000000 - 1000000, 
          percentage: Math.random() * 500 - 100 
        }
      }

      setTraders(prev => prev.map(trader => 
        trader.address === address ? {
          ...trader,
          perpEquity: data.freeMargin + data.totalUnrealizedPnl,
          mainPosition,
          directionBias,
          ...mockPnl,
          positions: data.positions,
          isLoading: false
        } : trader
      ))
    } catch (error) {
      console.error(`Error fetching data for trader ${address}:`, error)
      setTraders(prev => prev.map(trader => 
        trader.address === address ? {
          ...trader,
          isLoading: false,
          error: 'Failed to load data'
        } : trader
      ))
    }
  }

  const toggleExpanded = (address: string) => {
    setExpandedTraders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(address)) {
        newSet.delete(address)
      } else {
        newSet.add(address)
      }
      return newSet
    })
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchTraders()
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchTraders().finally(() => setIsLoading(false))
  }, [fetchTraders])

  const getAvatarColor = (address: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
    ]
    const index = address.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Calculate cumulative statistics
  const getCumulativeStats = () => {
    const loadedTraders = traders.filter(t => !t.isLoading && !t.error)
    
    if (loadedTraders.length === 0) {
      return {
        totalPnl: 0,
        totalEquity: 0,
        totalMarginUsed: 0,
        averageDirectionBias: { percentage: 0, isLong: true },
        totalLongValue: 0,
        totalShortValue: 0,
        totalPositions: 0
      }
    }

    const totalPnl = loadedTraders.reduce((sum, trader) => {
      switch (selectedTimeframe) {
        case '24H': return sum + trader.dailyPnl.amount
        case '1W': return sum + trader.weeklyPnl.amount
        case '1M': return sum + trader.monthlyPnl.amount
        case 'All': return sum + trader.allTimePnl.amount
        default: return sum + trader.dailyPnl.amount
      }
    }, 0)

    const totalEquity = loadedTraders.reduce((sum, trader) => sum + trader.perpEquity, 0)
    const totalPositions = loadedTraders.reduce((sum, trader) => sum + trader.positions.length, 0)

    // Calculate total long/short values based on position values
    let totalLongValue = 0
    let totalShortValue = 0

    loadedTraders.forEach(trader => {
      trader.positions.forEach(position => {
        if (position.side === 'long') {
          totalLongValue += position.sizeUSD
        } else {
          totalShortValue += position.sizeUSD
        }
      })
    })

    const totalPositionValue = totalLongValue + totalShortValue
    const longPercentage = totalPositionValue > 0 ? (totalLongValue / totalPositionValue) * 100 : 0
    const isLong = longPercentage >= 50

    return {
      totalPnl,
      totalEquity,
      totalMarginUsed: totalPositionValue * 0.1, // Rough estimate
      averageDirectionBias: {
        percentage: isLong ? longPercentage : 100 - longPercentage,
        isLong
      },
      totalLongValue,
      totalShortValue,
      totalPositions
    }
  }

  // Generate cumulative chart data
  const generateCumulativeChartData = () => {
    const now = Date.now()
    const dataPoints = []
    
    let timeRange: number
    let interval: number
    let points: number

    switch (selectedTimeframe) {
      case '24H':
        timeRange = 24 * 60 * 60 * 1000 // 24 hours
        interval = 60 * 60 * 1000 // 1 hour
        points = 24
        break
      case '1W':
        timeRange = 7 * 24 * 60 * 60 * 1000 // 7 days
        interval = 24 * 60 * 60 * 1000 // 1 day
        points = 7
        break
      case '1M':
        timeRange = 30 * 24 * 60 * 60 * 1000 // 30 days
        interval = 24 * 60 * 60 * 1000 // 1 day
        points = 30
        break
      case 'All':
        timeRange = 365 * 24 * 60 * 60 * 1000 // 1 year
        interval = 7 * 24 * 60 * 60 * 1000 // 1 week
        points = 52
        break
      default:
        timeRange = 24 * 60 * 60 * 1000
        interval = 60 * 60 * 1000
        points = 24
    }

    const stats = getCumulativeStats()
    const finalValue = stats.totalPnl

    // Generate progressive data points
    for (let i = 0; i <= points; i++) {
      const timestamp = now - timeRange + (i * interval)
      const progress = i / points
      
      // Create a realistic progression curve
      const value = finalValue * (Math.pow(progress, 1.5) + Math.random() * 0.1 - 0.05)
      
      dataPoints.push({
        timestamp,
        value: Math.round(value),
        date: new Date(timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          ...(selectedTimeframe === 'All' ? {} : { hour: selectedTimeframe === '24H' ? 'numeric' : undefined })
        })
      })
    }

    return dataPoints
  }

  const cumulativeStats = getCumulativeStats()
  const chartData = generateCumulativeChartData()

  const getTimeframeLabel = (timeframe: string): string => {
    switch (timeframe) {
      case '24H': return '24H'
      case '1W': return '1W'
      case '1M': return '1M'
      case 'All': return 'All Time'
      default: return '24H'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading traders...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Section */}
      <div className="space-y-6">
        {/* Cumulative Performance Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Portfolio Overview</CardTitle>
                <div className={cn("text-2xl font-bold mt-1", 
                  cumulativeStats.totalPnl >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {formatCurrency(cumulativeStats.totalPnl)}
                </div>
              </div>
              <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <TabsList>
                  <TabsTrigger value="24H">24H</TabsTrigger>
                  <TabsTrigger value="1W">1W</TabsTrigger>
                  <TabsTrigger value="1M">1M</TabsTrigger>
                  <TabsTrigger value="All">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Total Portfolio Worth: {formatCurrency(cumulativeStats.totalEquity)}
              </div>
              <div className="text-sm text-muted-foreground">•</div>
              <div className="text-sm text-muted-foreground">
                Active Positions: {cumulativeStats.totalPositions}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CumulativePerformanceChart
              data={chartData}
              timeframe={getTimeframeLabel(selectedTimeframe)}
              currentValue={cumulativeStats.totalPnl}
              isLoading={isLoading}
            />
            
            {/* Performance Summary */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">{getTimeframeLabel(selectedTimeframe)} Combined Performance</div>
                <div className={cn(
                  "text-lg font-bold",
                  cumulativeStats.totalPnl >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {formatCurrency(cumulativeStats.totalPnl)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Combined Portfolio Worth</div>
              <div className="text-2xl font-bold">{formatCurrency(cumulativeStats.totalEquity)}</div>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <div className="text-xs text-muted-foreground">Traders</div>
                  <div className="font-mono text-sm">{traders.filter(t => !t.isLoading && !t.error).length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Positions</div>
                  <div className="font-mono text-sm">{cumulativeStats.totalPositions}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Market Direction</div>
              <div className={cn(
                "text-lg font-bold mb-2",
                cumulativeStats.averageDirectionBias.isLong ? "text-green-500" : "text-red-500"
              )}>
                {cumulativeStats.averageDirectionBias.percentage.toFixed(1)}% {cumulativeStats.averageDirectionBias.isLong ? 'Long' : 'Short'}
              </div>
              <div className="text-xs text-muted-foreground">
                Long Exposure: {cumulativeStats.averageDirectionBias.isLong ? 
                  cumulativeStats.averageDirectionBias.percentage.toFixed(1) : 
                  (100 - cumulativeStats.averageDirectionBias.percentage).toFixed(1)
                }%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Money Allocation</div>
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Long</span>
                  </div>
                  <div className="text-sm font-mono">
                    {formatCurrency(cumulativeStats.totalLongValue)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Short</span>
                  </div>
                  <div className="text-sm font-mono">
                    {formatCurrency(cumulativeStats.totalShortValue)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Individual Traders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top Traders</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing 1-{traders.length} of {traders.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {traders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No traders added yet. Add traders in Settings to start monitoring their performance.
              </p>
              <Button asChild>
                <a href="/dashboard/settings">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Traders
                </a>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Trader</TableHead>
                    <TableHead>Perp Equity</TableHead>
                    <TableHead>Main Position</TableHead>
                    <TableHead>Direction Bias</TableHead>
                    <TableHead>Daily PnL</TableHead>
                    <TableHead>Weekly PnL</TableHead>
                    <TableHead>30D PnL</TableHead>
                    <TableHead>All Time PnL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {traders.map((trader) => (
                    <React.Fragment key={trader.address}>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          // Check if the click was on the expand/collapse chevron
                          if ((e.target as HTMLElement).closest('.expand-toggle')) {
                            toggleExpanded(trader.address)
                          } else {
                            // Navigate to trader detail page
                            window.location.href = `/dashboard/top-traders/${trader.address}`
                          }
                        }}
                      >
                        <TableCell className="font-mono">
                          <div className="flex items-center gap-2">
                            <div className="expand-toggle">
                              {expandedTraders.has(trader.address) ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </div>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={getAvatarColor(trader.address)}>
                                {trader.address.slice(2, 4).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-mono text-sm">
                                {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                              </div>
                              {trader.name && (
                                <div className="text-xs text-muted-foreground">{trader.name}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="font-semibold">
                          {trader.isLoading ? (
                            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                          ) : trader.error ? (
                            <span className="text-destructive text-sm">Error</span>
                          ) : (
                            formatCurrency(trader.perpEquity)
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {trader.isLoading ? (
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                          ) : trader.mainPosition ? (
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={trader.mainPosition.side === 'long' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {trader.mainPosition.side.toUpperCase()}
                              </Badge>
                              <span className="font-mono text-sm">
                                {trader.mainPosition.coin} {formatCurrency(trader.mainPosition.sizeUSD)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No positions</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {trader.isLoading ? (
                            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={trader.directionBias.percentage} 
                                className="w-16 h-2"
                              />
                              <span className={cn(
                                "text-sm font-medium",
                                trader.directionBias.isLong ? "text-green-500" : "text-red-500"
                              )}>
                                {Math.round(trader.directionBias.percentage)}% 
                                {trader.directionBias.isLong ? 'Long' : 'Short'}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {trader.isLoading ? (
                            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                          ) : (
                            <div>
                              <div className={cn(
                                "font-semibold",
                                trader.dailyPnl.amount >= 0 ? "text-green-500" : "text-red-500"
                              )}>
                                {formatCurrency(trader.dailyPnl.amount)}
                              </div>
                              <div className={cn(
                                "text-xs",
                                trader.dailyPnl.percentage >= 0 ? "text-green-500" : "text-red-500"
                              )}>
                                {trader.dailyPnl.percentage >= 0 ? '+' : ''}{trader.dailyPnl.percentage.toFixed(2)}%
                              </div>
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {trader.isLoading ? (
                            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                          ) : (
                            <div>
                              <div className={cn(
                                "font-semibold",
                                trader.weeklyPnl.amount >= 0 ? "text-green-500" : "text-red-500"
                              )}>
                                {formatCurrency(trader.weeklyPnl.amount)}
                              </div>
                              <div className={cn(
                                "text-xs",
                                trader.weeklyPnl.percentage >= 0 ? "text-green-500" : "text-red-500"
                              )}>
                                {trader.weeklyPnl.percentage >= 0 ? '+' : ''}{trader.weeklyPnl.percentage.toFixed(2)}%
                              </div>
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {trader.isLoading ? (
                            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                          ) : (
                            <div>
                              <div className={cn(
                                "font-semibold",
                                trader.monthlyPnl.amount >= 0 ? "text-green-500" : "text-red-500"
                              )}>
                                {formatCurrency(trader.monthlyPnl.amount)}
                              </div>
                              <div className={cn(
                                "text-xs",
                                trader.monthlyPnl.percentage >= 0 ? "text-green-500" : "text-red-500"
                              )}>
                                {trader.monthlyPnl.percentage >= 0 ? '+' : ''}{trader.monthlyPnl.percentage.toFixed(1)}%
                              </div>
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {trader.isLoading ? (
                            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                          ) : (
                            <div>
                              <div className={cn(
                                "font-semibold",
                                trader.allTimePnl.amount >= 0 ? "text-green-500" : "text-red-500"
                              )}>
                                {formatCurrency(trader.allTimePnl.amount)}
                              </div>
                              <div className={cn(
                                "text-xs",
                                trader.allTimePnl.percentage >= 0 ? "text-green-500" : "text-red-500"
                              )}>
                                {trader.allTimePnl.percentage >= 0 ? '+' : ''}{trader.allTimePnl.percentage.toFixed(0)}%
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                      
                      {expandedTraders.has(trader.address) && (
                        <TableRow>
                          <TableCell colSpan={8} className="p-0">
                            <div className="bg-muted/30 p-4">
                              <h4 className="font-semibold mb-3">Open Positions</h4>
                              {trader.positions.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No open positions</p>
                              ) : (
                                <div className="rounded-md border bg-background">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="h-8 text-xs">Coin</TableHead>
                                        <TableHead className="h-8 text-xs">Side</TableHead>
                                        <TableHead className="h-8 text-xs">Size (USD)</TableHead>
                                        <TableHead className="h-8 text-xs">Entry Price</TableHead>
                                        <TableHead className="h-8 text-xs">Mark Price</TableHead>
                                        <TableHead className="h-8 text-xs">PnL</TableHead>
                                        <TableHead className="h-8 text-xs">ROE</TableHead>
                                        <TableHead className="h-8 text-xs">Leverage</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {trader.positions.map((position, index) => (
                                        <TableRow key={index}>
                                          <TableCell className="py-2 text-sm">{position.coin}</TableCell>
                                          <TableCell className="py-2 text-sm">
                                            <Badge 
                                              variant={position.side === 'long' ? 'default' : 'destructive'}
                                              className="text-xs"
                                            >
                                              {position.side.toUpperCase()}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="py-2 text-sm">{formatCurrency(position.sizeUSD)}</TableCell>
                                          <TableCell className="py-2 text-sm">{formatCurrency(position.entryPrice)}</TableCell>
                                          <TableCell className="py-2 text-sm">{formatCurrency(position.markPrice)}</TableCell>
                                          <TableCell className="py-2 text-sm">
                                            <span className={cn(
                                              "font-medium",
                                              position.unrealizedPnl >= 0 ? "text-green-500" : "text-red-500"
                                            )}>
                                              {formatCurrency(position.unrealizedPnl)}
                                            </span>
                                          </TableCell>
                                          <TableCell className="py-2 text-sm">
                                            <span className={cn(
                                              "font-medium",
                                              position.returnOnEquity >= 0 ? "text-green-500" : "text-red-500"
                                            )}>
                                              {formatPercentage(position.returnOnEquity)}
                                            </span>
                                          </TableCell>
                                          <TableCell className="py-2 text-sm">{position.leverage}x</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 