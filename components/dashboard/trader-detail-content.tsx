'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, Star, Copy, TrendingUp, TrendingDown,
  RefreshCw, BarChart3, PieChart, Loader2, Heart,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react'
import { formatCurrency, formatPercentage, cn } from '@/lib/utils'
import { hyperliquidAPI } from '@/lib/services/hyperliquid'
import { useToast } from "@/components/ui/use-toast"
import { TraderPerformanceChart } from '@/components/ui/trader-performance-chart'

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
  positionValue: number
  openedAt?: number // timestamp when position was opened
  ageInMs?: number // calculated age in milliseconds
}

interface WalletData {
  address: string
  positions: Position[]
  totalUnrealizedPnl: number
  totalValue: number
  marginUsed: number
  freeMargin: number
  portfolioDelta: number
}

interface TraderDetailContentProps {
  address: string
  traderName?: string
  isInWatchlist: boolean
}

export default function TraderDetailContent({ 
  address, 
  traderName, 
  isInWatchlist 
}: TraderDetailContentProps) {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('24H')
  const [error, setError] = useState<string | null>(null)
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false)
  const [sortField, setSortField] = useState<keyof Position | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [walletName, setWalletName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const timeframes = ['24H', '1W', '1M', 'All']

  // Format position age
  const formatPositionAge = (ageInMs: number | undefined, openedAt: number | undefined): string => {
    if (!ageInMs || !openedAt) {
      // If we don't have age data, show a more helpful message
      return 'Recent'
    }
    
    const seconds = Math.floor(ageInMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return `${seconds}s`
    }
  }

  // Format position opening date
  const formatOpeningDate = (openedAt: number | undefined): string => {
    if (!openedAt) return 'Unknown date'
    
    const date = new Date(openedAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Sorting function
  const handleSort = (field: keyof Position) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Get sort icon
  const getSortIcon = (field: keyof Position) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />
  }

  // Sort positions
  const sortedPositions = useMemo(() => {
    if (!walletData?.positions || !sortField) {
      return walletData?.positions || []
    }

    return [...walletData.positions].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      // Handle string sorting (coin, side)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue)
        return sortDirection === 'asc' ? result : -result
      }
      
      // Handle number sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue
        return sortDirection === 'asc' ? result : -result
      }
      
      return 0
    })
  }, [walletData?.positions, sortField, sortDirection])

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      setError(null)
      const data = await hyperliquidAPI.getWalletPositions(address)
      setWalletData(data)
    } catch (err) {
      console.error('Error fetching wallet data:', err)
      setError('Failed to load trader data')
    }
  }

  // Initial load
  useEffect(() => {
    fetchWalletData().finally(() => setIsLoading(false))
  }, [address])

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchWalletData()
    setIsRefreshing(false)
  }

  // Add to watchlist
  const addToWatchlist = async () => {
    setIsAddingToWatchlist(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('top_traders')
        .insert([
          { 
            user_id: user.id, 
            address: address.toLowerCase(),
            name: traderName || null
          }
        ])

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already in Watchlist",
            description: "This trader is already in your watchlist",
            variant: "destructive"
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: "Added to Watchlist",
          description: "Trader has been added to your top traders list"
        })
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      toast({
        title: "Error",
        description: "Failed to add trader to watchlist",
        variant: "destructive"
      })
    } finally {
      setIsAddingToWatchlist(false)
    }
  }

  // Save wallet to saved wallets
  const saveWallet = async () => {
    if (!walletName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this wallet.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save wallets.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from('saved_wallets')
        .insert({
          user_id: user.id,
          address: address.toLowerCase(),
          name: walletName.trim(),
          created_at: new Date().toISOString()
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Wallet already saved",
            description: "This wallet is already in your saved wallets list.",
            variant: "destructive",
          })
        } else {
          console.error('Error saving wallet:', error)
          toast({
            title: "Error",
            description: "Failed to save wallet. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Success",
          description: "Wallet saved successfully!",
        })
        setShowSaveDialog(false)
        setWalletName('')
      }
    } catch (error) {
      console.error('Error saving wallet:', error)
      toast({
        title: "Error",
        description: "Failed to save wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate direction bias based on position values, not counts
  const getDirectionBias = () => {
    if (!walletData || walletData.positions.length === 0) {
      return { percentage: 0, isLong: true, label: 'NEUTRAL' }
    }

    const longValue = walletData.positions
      .filter(pos => pos.side === 'long')
      .reduce((sum, pos) => sum + pos.sizeUSD, 0)
    
    const shortValue = walletData.positions
      .filter(pos => pos.side === 'short')
      .reduce((sum, pos) => sum + pos.sizeUSD, 0)
    
    const totalValue = longValue + shortValue

    if (totalValue === 0) {
      return { percentage: 0, isLong: true, label: 'NEUTRAL' }
    }

    if (longValue === shortValue) {
      return { percentage: 50, isLong: true, label: 'NEUTRAL' }
    } else if (longValue > shortValue) {
      const percentage = (longValue / totalValue) * 100
      return { percentage, isLong: true, label: 'LONG' }
    } else {
      const percentage = (shortValue / totalValue) * 100
      return { percentage, isLong: false, label: 'SHORT' }
    }
  }

  // Calculate position distribution
  const getPositionDistribution = () => {
    if (!walletData || walletData.positions.length === 0) {
      return { longValue: 0, shortValue: 0, totalValue: 0 }
    }

    const longValue = walletData.positions
      .filter(pos => pos.side === 'long')
      .reduce((sum, pos) => sum + pos.sizeUSD, 0)

    const shortValue = walletData.positions
      .filter(pos => pos.side === 'short')
      .reduce((sum, pos) => sum + pos.sizeUSD, 0)

    return { longValue, shortValue, totalValue: longValue + shortValue }
  }

  // Generate historical PnL data from Hyperliquid portfolio API
  const generateHistoricalPnLData = (timeframe: string, portfolioHistory: any) => {
    if (!portfolioHistory) {
      return []
    }

    let timeframeKey: string
    switch (timeframe) {
      case '24H':
        timeframeKey = 'day'
        break
      case '1W':
        timeframeKey = 'week'
        break
      case '1M':
        timeframeKey = 'month'
        break
      case 'All':
        timeframeKey = 'allTime'
        break
      default:
        timeframeKey = 'day'
    }
    
    const timeframeData = portfolioHistory[timeframeKey]
    if (!timeframeData || !timeframeData.pnlHistory) {
      return []
    }
    
    // Convert Hyperliquid portfolio data to chart format
    return timeframeData.pnlHistory.map(([timestamp, pnlValue]: [number, string]) => ({
      timestamp,
      value: parseFloat(pnlValue),
      time: new Date(timestamp).toISOString()
    }))
  }

  // Calculate PnL for the selected timeframe
  const getTimeframePnL = (timeframe: string, portfolioHistory: any): number => {
    if (!portfolioHistory) {
      return walletData?.totalUnrealizedPnl || 0
    }

    let timeframeKey: string
    switch (timeframe) {
      case '24H':
        timeframeKey = 'day'
        break
      case '1W':
        timeframeKey = 'week'
        break
      case '1M':
        timeframeKey = 'month'
        break
      case 'All':
        timeframeKey = 'allTime'
        break
      default:
        timeframeKey = 'day'
    }
    
    const timeframeData = portfolioHistory[timeframeKey]
    if (!timeframeData || !timeframeData.pnlHistory || timeframeData.pnlHistory.length < 2) {
      return walletData?.totalUnrealizedPnl || 0
    }
    
    // Calculate the PnL change over the timeframe
    const firstPnL = parseFloat(timeframeData.pnlHistory[0][1]) || 0
    const latestPnL = parseFloat(timeframeData.pnlHistory[timeframeData.pnlHistory.length - 1][1]) || 0
    
    // Return the change in PnL over the timeframe
    return latestPnL - firstPnL
  }

  // Get timeframe display label
  const getTimeframeLabel = (timeframe: string): string => {
    switch (timeframe) {
      case '24H':
        return '24H'
      case '1W':
        return '1W'
      case '1M':
        return '1M'
      case 'All':
        return 'All Time'
      default:
        return '24H'
    }
  }

  const chartData = useMemo(() => {
    if (!walletData?.portfolioHistory) return []
    return generateHistoricalPnLData(selectedTimeframe, walletData.portfolioHistory)
  }, [selectedTimeframe, walletData?.portfolioHistory])

  // Calculate timeframe-specific PnL
  const timeframePnL = useMemo(() => {
    return getTimeframePnL(selectedTimeframe, walletData?.portfolioHistory)
  }, [selectedTimeframe, walletData?.portfolioHistory, walletData?.totalUnrealizedPnl])

  const directionBias = getDirectionBias()
  const positionDist = getPositionDistribution()
  const leverage = walletData && walletData.totalValue > 0 ? (positionDist.totalValue / walletData.totalValue) : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading trader data...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </h1>
            {traderName && (
              <p className="text-muted-foreground">{traderName}</p>
            )}
          </div>
          <Button variant="ghost" size="sm">
            <Star className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Star className="h-4 w-4 mr-2" />
                Save Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Wallet</DialogTitle>
                <DialogDescription>
                  Add this wallet to your saved wallets list with a custom name.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="wallet-name">Wallet Name</Label>
                  <Input
                    id="wallet-name"
                    placeholder="Enter a name for this wallet"
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Address: {address}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveWallet} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Wallet'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Advanced
          </Button>
          <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Report
          </Button>
          {!isInWatchlist && (
            <Button 
              onClick={addToWatchlist}
              disabled={isAddingToWatchlist}
            >
              {isAddingToWatchlist ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Heart className="h-4 w-4 mr-2" />
              )}
              Add to Watchlist
            </Button>
          )}
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Portfolio Worth</div>
            <div className="text-2xl font-bold">{formatCurrency(walletData?.totalValue || 0)}</div>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <div className="text-xs text-muted-foreground">Trading</div>
                <div className="font-mono text-sm">{formatCurrency(walletData?.totalValue || 0)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Savings</div>
                <div className="font-mono text-sm">$0.00</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Available Cash</div>
            <div className="text-2xl font-bold">{formatCurrency(walletData?.freeMargin || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">Money you can take out</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Risk Level</div>
            <div className="text-2xl font-bold">{leverage.toFixed(2)}x</div>
            <div className="text-xs text-muted-foreground mt-1">Higher = more risky</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Performance Chart */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{getTimeframeLabel(selectedTimeframe)} PnL</CardTitle>
                  <div className={cn("text-2xl font-bold mt-1", 
                    timeframePnL >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatCurrency(timeframePnL)}
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
                  Portfolio Worth: {formatCurrency(walletData?.totalValue || 0)}
                </div>
                <div className="text-sm text-muted-foreground">•</div>
                <div className="text-sm text-muted-foreground">Money at Risk</div>
                <Progress value={56} className="w-32" />
                <div className="text-sm">56.00%</div>
              </div>
            </CardHeader>
            <CardContent>
              <TraderPerformanceChart
                data={chartData}
                timeframe={selectedTimeframe}
                currentValue={walletData?.totalUnrealizedPnl || 0}
                isLoading={isLoading}
              />
              
              {/* Performance Summary */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{getTimeframeLabel(selectedTimeframe)} Profit & Loss</div>
                  <div className={cn(
                    "text-lg font-bold",
                    timeframePnL >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatCurrency(timeframePnL)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-2">Market Direction</div>
              <div className={cn(
                "text-lg font-bold mb-2",
                directionBias.isLong ? "text-green-500" : "text-red-500"
              )}>
                {directionBias.label}
              </div>
              <div className="text-sm text-muted-foreground">
                Long Exposure: {directionBias.isLong ? directionBias.percentage.toFixed(1) : (100 - directionBias.percentage).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-4">Money Allocation</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Long</span>
                  </div>
                  <div className="text-sm font-mono">
                    {formatCurrency(positionDist.longValue)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Short</span>
                  </div>
                  <div className="text-sm font-mono">
                    {formatCurrency(positionDist.shortValue)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-2">Unrealized PnL</div>
              <div className={cn(
                "text-2xl font-bold",
                walletData && walletData.totalUnrealizedPnl >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {formatCurrency(walletData?.totalUnrealizedPnl || 0)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {walletData && walletData.totalUnrealizedPnl >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={cn(
                  "text-sm",
                  walletData && walletData.totalUnrealizedPnl >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  95.83% Return
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Trades</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Trades: {walletData?.positions.length || 0}</span>
              <span>Total: {formatCurrency(positionDist.totalValue)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('coin')}
                    >
                      Coin
                      {getSortIcon('coin')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('side')}
                    >
                      Direction
                      {getSortIcon('side')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('sizeUSD')}
                    >
                      Trade Size
                      {getSortIcon('sizeUSD')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('unrealizedPnl')}
                    >
                      Paper Profit
                      {getSortIcon('unrealizedPnl')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('entryPrice')}
                    >
                      Bought At
                      {getSortIcon('entryPrice')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('markPrice')}
                    >
                      Market Price
                      {getSortIcon('markPrice')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('liquidationPrice')}
                    >
                      Danger Zone
                      {getSortIcon('liquidationPrice')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('margin')}
                    >
                      Money at Risk
                      {getSortIcon('margin')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('ageInMs')}
                    >
                      Age
                      {getSortIcon('ageInMs')}
                    </Button>
                  </TableHead>
                  <TableHead>Funding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPositions.map((position, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {position.coin}
                      <div className="text-xs text-muted-foreground">
                        {position.leverage}x
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={position.side === 'long' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {position.side.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>{formatCurrency(position.sizeUSD)}</div>
                      <div className="text-xs text-muted-foreground">
                        {position.sizeUSD > 0 ? `${(position.sizeUSD / position.markPrice).toFixed(4)} ${position.coin}` : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "font-medium",
                        position.unrealizedPnl >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {formatCurrency(position.unrealizedPnl)}
                      </div>
                      <div className={cn(
                        "text-xs",
                        position.returnOnEquity >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {formatPercentage(position.returnOnEquity)}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(position.entryPrice)}</TableCell>
                    <TableCell>{formatCurrency(position.markPrice)}</TableCell>
                    <TableCell>{formatCurrency(position.liquidationPrice)}</TableCell>
                    <TableCell>{formatCurrency(position.margin)}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {formatPositionAge(position.ageInMs, position.openedAt)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatOpeningDate(position.openedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-green-500">
                      $83,262.83
                    </TableCell>
                  </TableRow>
                ))}
                {(!walletData?.positions || walletData.positions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No active trades
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 