'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { Wallet, ArrowUpRight, Pencil, Trash2 } from "lucide-react"
import { ChevronUp } from "lucide-react"

// Format number for display
function formatNumber(value: number): string {
  const absValue = Math.abs(value)
  
  // For values >= 1 million
  if (absValue >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M'
  }
  
  // For values >= 1 thousand
  if (absValue >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  
  // For values with decimal places
  if (absValue % 1 !== 0) {
    return value.toFixed(2)
  }
  
  // For whole numbers
  return value.toLocaleString()
}

interface WalletDetail {
  id: string
  address: string
  name: string
}

interface Trade {
  coin: string
  side: 'long' | 'short'
  size: number
  price: number
  time: number
  pnl: number
  type: 'open' | 'close'
}

interface WalletStats {
  thirtyDayPnl: number
  allTimePnl: number
  totalTrades: number
  winRate: number
  averageTrade: number
  bestTrade: number
  worstTrade: number
}

interface Position {
  coin: string
  side: 'long' | 'short'
  sizeUSD: number
  entryPrice: number
  unrealizedPnl: number
  leverage: number
  liquidationPrice: number
  margin: number
  positionValue: number
  returnOnEquity: number
  maxLeverage: number
  cumFunding: {
    allTime: number
    sinceChange: number
    sinceOpen: number
  }
  currentFunding: number
  markPrice: number
  health: number
  time: number
}

interface WalletData {
  address: string
  positions: Position[]
  totalUnrealizedPnl: number
  totalValue: number
  portfolioDelta: number
  allTimePnl: number
  positionBias?: {
    percentage: number
    isLong: boolean
  }
}

export default function WalletDetailPage({ params }: { params: { address: string } }) {
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const router = useRouter()
  const [walletDetail, setWalletDetail] = useState<WalletDetail | null>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [clearinghouseData, setClearinghouseData] = useState<any>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingTrades, setIsLoadingTrades] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newName, setNewName] = useState("")
  const [positionsPerPage, setPositionsPerPage] = useState(10)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortField, setSortField] = useState<keyof Position | ''>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const fetchWalletDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: wallet } = await supabase
        .from('followed_wallets')
        .select('id, address, name')
        .eq('user_id', user.id)
        .eq('address', params.address)
        .single()

      if (wallet) {
        setWalletDetail(wallet)
        setNewName(wallet.name)
      }
    }

    fetchWalletDetails()
  }, [params.address, supabase])

  const handleUpdateName = async () => {
    if (!walletDetail?.id) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('followed_wallets')
        .update({ name: newName })
        .eq('id', walletDetail.id)

      if (error) throw error

      setWalletDetail(prev => prev ? { ...prev, name: newName } : null)
      setIsEditing(false)
      
      toast({
        title: "Wallet Updated",
        description: "The wallet name has been updated successfully.",
      })

      // Trigger sidebar update
      window.dispatchEvent(new Event('walletFollowed'))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update wallet name.",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!walletDetail?.id) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('followed_wallets')
        .delete()
        .eq('id', walletDetail.id)

      if (error) throw error

      toast({
        title: "Wallet Unfollowed",
        description: "The wallet has been removed from your followed list.",
      })

      // Trigger sidebar update and redirect
      window.dispatchEvent(new Event('walletFollowed'))
      router.push('/dashboard/tool-3')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow wallet.",
        variant: "destructive"
      })
      setShowDeleteDialog(false)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    // Load wallet details from localStorage
    if (typeof window !== 'undefined') {
      const storedWallets = localStorage.getItem('followedWallets')
      if (storedWallets) {
        try {
          const parsedWallets = JSON.parse(storedWallets)
          const foundWallet = parsedWallets.find((w: WalletDetail) => w.address === params.address)
          if (foundWallet) {
            setWalletDetail(foundWallet)
          }
        } catch (error) {
          console.error('Error parsing followed wallets:', error)
        }
      }
    }
    
    // Fetch wallet data
    const fetchWalletData = async () => {
      setIsLoading(true)
      try {
        // Get positions data
        const response = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'clearinghouseState',
            user: params.address,
          }),
        })
        
        if (!response.ok) throw new Error('Failed to fetch wallet positions')
        
        const clearinghouseDataResponse = await response.json()
        console.log('Clearinghouse data:', clearinghouseDataResponse)
        setClearinghouseData(clearinghouseDataResponse)

        // Process positions data
        let positions: Position[] = []
        let totalUnrealizedPnl = 0
        let longValue = 0
        let shortValue = 0
        let totalValue = 0

        if (clearinghouseDataResponse.assetPositions) {
          positions = clearinghouseDataResponse.assetPositions.map((pos: any) => {
            console.log('Processing position:', pos)
            const position = pos.position || {}
            const side = position.side?.toLowerCase() || (parseFloat(position.szi) > 0 ? 'long' : 'short')
            const sizeUSD = parseFloat(position.sizeUsd || position.positionValue || Math.abs(parseFloat(position.szi) * parseFloat(position.entryPx)))
            const unrealizedPnl = parseFloat(position.unrealizedPnl || '0')
            const time = position.time || Date.now()

            // Add position value to the corresponding total
            if (side === 'long') {
              longValue += sizeUSD
            } else {
              shortValue += sizeUSD
            }

            console.log(`Position: ${pos.coin || pos.asset} ${side} $${sizeUSD} (Long: $${longValue}, Short: $${shortValue})`)

            totalUnrealizedPnl += unrealizedPnl

            return {
              coin: pos.coin || pos.asset || position.coin || position.asset,
              side,
              sizeUSD: Math.abs(sizeUSD),
              entryPrice: parseFloat(position.entryPx || '0'),
              unrealizedPnl,
              leverage: parseFloat(position.leverage?.value || position.leverage || "1"),
              liquidationPrice: parseFloat(position.liquidationPx || '0'),
              returnOnEquity: parseFloat(position.unrealizedPnl || '0') / parseFloat(position.margin || '1'),
              margin: parseFloat(position.margin || '0'),
              positionValue: parseFloat(position.positionValue || '0'),
              maxLeverage: parseFloat(position.maxLeverage || '0'),
              cumFunding: {
                allTime: parseFloat(position.cumFunding?.allTime || '0'),
                sinceChange: parseFloat(position.cumFunding?.sinceChange || '0'),
                sinceOpen: parseFloat(position.cumFunding?.sinceOpen || '0')
              },
              currentFunding: parseFloat(position.currentFunding || '0'),
              markPrice: parseFloat(position.markPrice || '0'),
              health: parseFloat(position.health || '0'),
              time,
            }
          })

          console.log('Final positions:', positions)
        }

        // Update total value and calculate position bias
        totalValue = parseFloat(clearinghouseDataResponse.marginSummary.accountValue) + totalUnrealizedPnl
        const positionBias = totalValue === 0 ? 
          { percentage: 0, isLong: true } : 
          longValue >= shortValue ?
            { percentage: Math.round((longValue / totalValue) * 100), isLong: true } :
            { percentage: Math.round((shortValue / totalValue) * 100), isLong: false }

        console.log('Position bias calculation:', {
          longValue,
          shortValue,
          totalValue,
          percentage: positionBias.percentage,
          isLong: positionBias.isLong
        })

        // Get trade history for all-time PnL
        const tradeHistoryResponse = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'userFills',
            user: params.address,
            startTime: 0,
            endTime: Date.now(),
          }),
        })
        
        if (!tradeHistoryResponse.ok) throw new Error('Failed to fetch trade history')
        
        const tradeHistoryData = await tradeHistoryResponse.json()
        
        // Calculate all-time PnL from trade history
        const allTimePnl = calculateAllTimePnl(tradeHistoryData.fills)
        
        // Calculate portfolio delta (24h change)
        const portfolioDelta = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0)
        
        setWalletData({
          address: params.address,
          positions,
          totalUnrealizedPnl,
          totalValue,
          portfolioDelta,
          allTimePnl,
          positionBias
        })
      } catch (error) {
        console.error('Error fetching wallet data:', error)
        toast({
          title: "Error",
          description: "Failed to fetch wallet data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchWalletData()
  }, [params.address])

  const calculateAllTimePnl = (tradeHistory: any[]): number => {
    if (!tradeHistory || !Array.isArray(tradeHistory) || tradeHistory.length === 0) {
      return 0
    }

    try {
      // Sum up realized PnL from all trades
      return tradeHistory.reduce((total, trade) => {
        const pnl = parseFloat(trade.realizedPnl || "0")
        return total + (isNaN(pnl) ? 0 : pnl)
      }, 0)
    } catch (error) {
      console.error('Error calculating all-time PnL:', error)
      return 0
    }
  }
  
  const calculatePositionBias = (longValue: number, shortValue: number): { percentage: number, isLong: boolean } => {
    const totalValue = longValue + shortValue
    
    // If no positions, return 0%
    if (totalValue === 0) {
      console.log('No positions found, returning 0%')
      return { percentage: 0, isLong: true }
    }
    
    // Calculate percentages
    const longPercentage = (longValue / totalValue) * 100
    const shortPercentage = (shortValue / totalValue) * 100
    
    console.log('Position bias calculation:', {
      longValue,
      shortValue,
      totalValue,
      longPercentage: longPercentage.toFixed(2) + '%',
      shortPercentage: shortPercentage.toFixed(2) + '%'
    })

    // Return the dominant side's percentage
    if (longValue >= shortValue) {
      return { 
        percentage: Math.round(longPercentage), 
        isLong: true 
      }
    } else {
      return { 
        percentage: Math.round(shortPercentage), 
        isLong: false 
      }
    }
  }

  const handleSort = (field: keyof Position) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return null
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4 inline text-green-500" />
      : <ChevronDown className="ml-1 h-4 w-4 inline text-green-500" />
  }

  const getSortedPositions = () => {
    if (!walletData?.positions) return []
    return [...walletData.positions].sort((a, b) => {
      if (sortField === '') return 0
      const aValue = a[sortField]
      const bValue = b[sortField]
      if (aValue === bValue) return 0
      const modifier = sortDirection === 'asc' ? 1 : -1
      return aValue > bValue ? modifier : -modifier
    })
  }

  const fetchTradeHistory = async () => {
    setIsLoadingTrades(true)
    try {
      console.log('Fetching trades for address:', params.address)
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'userFills',
          user: params.address,
          startTime: 0,
          endTime: Date.now(),
        }),
      })

      if (!response.ok) throw new Error('Failed to fetch trades')

      const data = await response.json()
      console.log('Raw trade data structure:', {
        hasData: !!data,
        keys: data ? Object.keys(data) : [],
        fills: data?.fills,
        fillsType: data?.fills ? typeof data.fills : 'undefined'
      })
      
      // Handle case where fills might be in a different location
      let fills = []
      if (data?.data?.fills) {
        fills = data.data.fills
      } else if (data?.fills) {
        fills = data.fills
      } else if (Array.isArray(data)) {
        fills = data
      } else {
        console.error('Could not find fills in response:', data)
        throw new Error('Invalid trade data structure')
      }
      
      // Process trades to calculate stats - limit to 10 most recent trades
      const processedTrades = fills
        .sort((a: any, b: any) => b.time - a.time) // Sort by most recent first
        .slice(0, 10) // Take only the 10 most recent trades
        .map((trade: any) => {
          console.log('Processing trade:', {
            raw: trade,
            fields: {
              coin: trade.coin || trade.asset || trade.symbol,
              side: trade.side,
              size: trade.sz || trade.size,
              price: trade.px || trade.price,
              pnl: trade.realizedPnl || trade.realizedPnlQuote || trade.pnl,
              closedPnl: trade.closedPnl
            }
          })

          const pnl = parseFloat(trade.realizedPnl || trade.realizedPnlQuote || trade.pnl || '0')
          const isClosing = trade.closedPnl || trade.isClosing || trade.orderType === 'close' || false

          return {
            coin: trade.coin || trade.asset || trade.symbol || '',
            side: trade.side === 1 || trade.side === 'long' ? 'long' : 'short',
            size: Math.abs(parseFloat(trade.sz || trade.size || '0')),
            price: parseFloat(trade.px || trade.price || '0'),
            time: trade.time || trade.timestamp || Date.now(),
            pnl: isClosing ? pnl : 0, // Only show PnL for closing trades
            type: isClosing ? 'close' : 'open'
          }
        })

      console.log('Processed trades:', processedTrades)
      setTrades(processedTrades)

      if (processedTrades.length === 0) {
        setStats(null)
        return
      }

      // Calculate 30-day PnL and other stats using all trades, not just the last 10
      const allTrades = fills.map((trade: any) => {
        const pnl = parseFloat(trade.realizedPnl || trade.realizedPnlQuote || trade.pnl || '0')
        const isClosing = trade.closedPnl || trade.isClosing || trade.orderType === 'close' || false

        return {
          coin: trade.coin || trade.asset || trade.symbol || '',
          side: trade.side === 1 || trade.side === 'long' ? 'long' : 'short',
          size: Math.abs(parseFloat(trade.sz || trade.size || '0')),
          price: parseFloat(trade.px || trade.price || '0'),
          time: trade.time || trade.timestamp || Date.now(),
          pnl: isClosing ? pnl : 0, // Only count PnL for closing trades
          type: isClosing ? 'close' : 'open'
        }
      })

      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      const thirtyDayTrades = allTrades.filter((t: Trade) => t.time >= thirtyDaysAgo)
      const thirtyDayPnl = thirtyDayTrades.reduce((sum: number, t: Trade) => sum + t.pnl, 0)
      
      const allTimePnl = allTrades.reduce((sum: number, t: Trade) => sum + t.pnl, 0)
      const closedTrades = allTrades.filter((t: Trade) => t.type === 'close')
      const profitableTrades = closedTrades.filter((t: Trade) => t.pnl > 0)
      const winRate = (profitableTrades.length / (closedTrades.length || 1)) * 100
      const averageTrade = allTimePnl / (closedTrades.length || 1)
      const bestTrade = Math.max(...closedTrades.map((t: Trade) => t.pnl), 0)
      const worstTrade = Math.min(...closedTrades.map((t: Trade) => t.pnl), 0)

      const stats = {
        thirtyDayPnl,
        allTimePnl,
        totalTrades: closedTrades.length,
        winRate,
        averageTrade,
        bestTrade,
        worstTrade
      }
      
      console.log('Calculated stats:', stats)
      setStats(stats)

    } catch (error) {
      console.error('Error fetching trade history:', error)
      toast({
        title: "Error",
        description: "Failed to fetch trade history. " + (error as Error).message,
        variant: "destructive"
      })
    } finally {
      setIsLoadingTrades(false)
    }
  }

  useEffect(() => {
    fetchTradeHistory()
  }, [params.address])

  const openExplorer = () => {
    window.open(`https://arbiscan.io/address/${params.address}`, '_blank')
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="max-w-sm"
                    placeholder="Enter wallet name"
                    disabled={isUpdating}
                  />
                  <Button 
                    onClick={handleUpdateName} 
                    disabled={isUpdating}
                    size="sm"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setNewName(walletDetail?.name || "")
                    }}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>{walletDetail?.name || params.address}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {params.address}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={openExplorer}>
            View on Explorer
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unfollow Wallet</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unfollow this wallet? You can always follow it again later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Unfollow"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading wallet data...</span>
          </div>
        ) : walletData ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Account Summary</CardTitle>
                    <CardDescription>
                      Overview of wallet positions and performance
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(parseFloat(clearinghouseData?.marginSummary?.accountValue || "0") + (walletData?.totalUnrealizedPnl || 0))}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unrealized PnL</p>
                    <p className={`text-2xl font-bold ${walletData?.totalUnrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(walletData?.totalUnrealizedPnl || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Position Bias</p>
                    {walletData?.positions?.length > 0 ? (
                      <div>
                        <p className={`text-2xl font-bold ${walletData?.positionBias?.isLong ? 'text-green-500' : 'text-red-500'}`}>
                          {Math.round(walletData?.positionBias?.percentage || 0)}%
                          <span className="text-sm font-normal ml-1">
                            {walletData?.positionBias?.isLong ? 'Long' : 'Short'}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {walletData?.positions?.length} Position{walletData?.positions?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-muted-foreground">No Positions</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Free Margin</p>
                    <p className="text-2xl font-bold">{formatCurrency(parseFloat(clearinghouseData?.marginSummary?.accountValue || "0"))}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">Portfolio Delta</p>
                  <p className={`text-2xl font-bold ${walletData?.portfolioDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(walletData?.portfolioDelta || 0)}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      {walletData?.portfolioDelta >= 0 ? 'Net Long' : 'Net Short'}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open Positions</CardTitle>
                <CardDescription>
                  Current active positions on Hyperliquid
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('coin')}>
                          Coin <SortIcon field="coin" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('side')}>
                          Side <SortIcon field="side" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('sizeUSD')}>
                          Size (USD) <SortIcon field="sizeUSD" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('entryPrice')}>
                          Entry Price <SortIcon field="entryPrice" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('liquidationPrice')}>
                          Liq. Price <SortIcon field="liquidationPrice" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('unrealizedPnl')}>
                          PnL <SortIcon field="unrealizedPnl" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('returnOnEquity')}>
                          ROE <SortIcon field="returnOnEquity" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('leverage')}>
                          Leverage <SortIcon field="leverage" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('margin')}>
                          Margin <SortIcon field="margin" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('positionValue')}>
                          Position Value <SortIcon field="positionValue" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('maxLeverage')}>
                          Max Leverage <SortIcon field="maxLeverage" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('cumFunding')}>
                          Cumulative Funding <SortIcon field="cumFunding" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('currentFunding')}>
                          Current Funding <SortIcon field="currentFunding" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('markPrice')}>
                          Mark Price <SortIcon field="markPrice" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('health')}>
                          Health <SortIcon field="health" />
                        </th>
                        <th className="p-2 text-left text-sm cursor-pointer hover:bg-accent/50" onClick={() => handleSort('time')}>
                          Time <SortIcon field="time" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedPositions().map((position, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 text-sm">{position.coin}</td>
                          <td className="p-2 text-sm">
                            <span className={position.side === 'long' ? 'text-green-500' : 'text-red-500'}>
                              {position.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2 text-sm">{formatCurrency(position.sizeUSD)}</td>
                          <td className="p-2 text-sm">{formatCurrency(position.entryPrice)}</td>
                          <td className="p-2 text-sm">{formatCurrency(position.liquidationPrice)}</td>
                          <td className="p-2 text-sm">
                            <span className={position.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {formatCurrency(position.unrealizedPnl)}
                            </span>
                          </td>
                          <td className="p-2 text-sm">
                            <span className={position.returnOnEquity >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {formatPercentage(position.returnOnEquity)}
                            </span>
                          </td>
                          <td className="p-2 text-sm">{position.leverage}x</td>
                          <td className="p-2 text-sm">{formatCurrency(position.margin)}</td>
                          <td className="p-2 text-sm">{formatCurrency(position.positionValue)}</td>
                          <td className="p-2 text-sm">{position.maxLeverage}x</td>
                          <td className="p-2 text-sm">{formatCurrency(position.cumFunding.allTime)}</td>
                          <td className="p-2 text-sm">{formatCurrency(position.currentFunding)}</td>
                          <td className="p-2 text-sm">{formatCurrency(position.markPrice)}</td>
                          <td className="p-2 text-sm">{formatCurrency(position.health)}</td>
                          <td className="p-2 text-sm">{new Date(position.time).toLocaleString()}</td>
                        </tr>
                      ))}
                      {walletData?.positions?.length === 0 && (
                        <tr>
                          <td colSpan={15} className="p-4 text-center text-sm text-muted-foreground">
                            No open positions
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trading Performance</CardTitle>
                <CardDescription>
                  Historical PnL and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTrades ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">30 Day PnL</p>
                      <p className={`text-2xl font-bold ${stats.thirtyDayPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(stats.thirtyDayPnl)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">All Time PnL</p>
                      <p className={`text-2xl font-bold ${stats.allTimePnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(stats.allTimePnl)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                      <p className="text-2xl font-bold">{stats.totalTrades}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                      <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Trade</p>
                      <p className={`text-2xl font-bold ${stats.averageTrade >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(stats.averageTrade)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Best Trade</p>
                      <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.bestTrade)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Worst Trade</p>
                      <p className="text-2xl font-bold text-red-500">{formatCurrency(stats.worstTrade)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No trade history available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
                <CardDescription>Last 10 trades</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTrades ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : trades.length > 0 ? (
                  <div className="space-y-2">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Side</TableHead>
                            <TableHead className="text-right">Size</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">PnL</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trades.map((trade, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{trade.coin}</TableCell>
                              <TableCell>
                                <Badge variant={trade.side === 'long' ? 'default' : 'destructive'}>
                                  {trade.side.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">${formatNumber(trade.size * trade.price)}</TableCell>
                              <TableCell className="text-right">${formatNumber(trade.price)}</TableCell>
                              <TableCell className={cn(
                                "text-right font-medium",
                                trade.pnl >= 0 ? "text-green-500" : "text-red-500"
                              )}>
                                {trade.type === 'close' ? 
                                  `${trade.pnl >= 0 ? '+' : ''}${formatNumber(trade.pnl)}` : 
                                  'Open'}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {new Date(trade.time).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No trade history available
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Data Available</CardTitle>
              <CardDescription>Could not load wallet data</CardDescription>
            </CardHeader>
            <CardContent>
              <p>There was an error loading data for this wallet. Please try again later.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
