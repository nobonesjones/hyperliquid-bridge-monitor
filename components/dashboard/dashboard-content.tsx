'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu'
import { 
  Dialog, DialogTrigger, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowUpCircle, ArrowDownCircle, RefreshCw, 
  ChevronDown, ExternalLink, ArrowDownToLine, ArrowUpFromLine, Eye, ChevronRight
} from 'lucide-react'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { blockchainMonitor, CONFIG } from '@/lib/services/blockchain-monitor'
import { useToast } from "@/components/ui/use-toast"

interface Position {
  side: 'long' | 'short'
  sizeUSD: number
}

interface WalletData {
  positions: Position[]
}

interface PositionBias {
  isLong: boolean
  percentage: number
}

interface Transfer {
  network: string
  type: 'deposit' | 'withdrawal'
  token: string
  from: string
  to: string
  amount: number
  timestamp: number
  txHash: string
  blockNumber: number
  explorerUrl: string
  positionBias?: PositionBias | null
  isLoadingBias?: boolean
  hasNoPositions?: boolean
  positionCount?: number
}

const supabase = createClientComponentClient()

export default function DashboardContent() {
  const { toast } = useToast()
  const [threshold, setThreshold] = useState(1000000)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState("")
  const [followDialogOpen, setFollowDialogOpen] = useState(false)
  const [selectedTrader, setSelectedTrader] = useState<any>(null)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all')
  const [testWalletData, setTestWalletData] = useState<any>(null)
  const [testWalletAddress, setTestWalletAddress] = useState<string>('')
  const [testWalletLoading, setTestWalletLoading] = useState<boolean>(false)
  const [followLoading, setFollowLoading] = useState<string | null>(null)
  const [deposits24h, setDeposits24h] = useState<{
    total: number;
    deposits: number;
    withdrawals: number;
    lastUpdated: string;
  }>({
    total: 0,
    deposits: 0,
    withdrawals: 0,
    lastUpdated: new Date().toLocaleString()
  })
  const router = useRouter()

  useEffect(() => {
    const loadTransfers = async () => {
      try {
        const transfers = await blockchainMonitor.getTransfers()
        console.log('Loaded transfers:', transfers) // Debug log
        setTransfers(transfers)
        setLastUpdated(new Date().toLocaleString())
      } catch (error) {
        console.error('Error loading transfers:', error)
      }
    }

    loadTransfers()
  }, [])

  // Initialize blockchain monitor
  useEffect(() => {
    async function initializeMonitor() {
      const success = await blockchainMonitor.initialize()
      setIsInitialized(success)
      if (success) {
        const initialTransfers = await blockchainMonitor.checkForTransfers()
        setTransfers(initialTransfers)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    }

    initializeMonitor()

    // Set up polling
    const interval = setInterval(async () => {
      if (isInitialized) {
        const newTransfers = await blockchainMonitor.checkForTransfers()
        setTransfers(newTransfers)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    }, 30000) // 30 seconds polling interval

    return () => clearInterval(interval)
  }, [isInitialized])

  // Load saved position data on component mount
  useEffect(() => {
    const savedPositions = sessionStorage.getItem('walletPositions')
    if (savedPositions) {
      const positions = JSON.parse(savedPositions)
      setTransfers(prev => prev.map(t => ({
        ...t,
        ...positions[t.txHash]
      })))
    }
  }, [])

  // Save position data when it changes
  useEffect(() => {
    const positionsToSave = transfers.reduce((acc, t) => {
      if (t.positionBias || t.hasNoPositions) {
        acc[t.txHash] = {
          positionBias: t.positionBias,
          hasNoPositions: t.hasNoPositions,
          positionCount: t.positionCount
        }
      }
      return acc
    }, {} as Record<string, any>)
    
    sessionStorage.setItem('walletPositions', JSON.stringify(positionsToSave))
  }, [transfers])

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  // Format percentage with + or - sign
  const formatPercentage = (percent: number) => {
    return percent >= 0 ? `+${Math.round(percent)}%` : `${Math.round(percent)}%`
  }

  // Get class for PnL coloring
  const getPnlColorClass = (pnl: number) => {
    return pnl >= 0 ? "text-green-500" : "text-red-500"
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    if (isInitialized) {
      const newTransfers = await blockchainMonitor.checkForTransfers()
      setTransfers(newTransfers)
      setLastUpdated(new Date().toLocaleTimeString())
    }
    setIsRefreshing(false)
  }

  // Open follow dialog
  const openFollowDialog = (transfer: Transfer) => {
    setSelectedTrader({ wallet: transfer.from, nickname: `Trader-${transfer.from.slice(0, 6)}` })
    setFollowDialogOpen(true)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })
  }

  const calculatePositionBias = (positions: any[]) => {
    if (!positions || positions.length === 0) return { percentage: 0, isLong: true }
    
    const totalValue = positions.reduce((sum: number, pos: any) => sum + Math.abs(pos.sizeUSD || 0), 0)
    const longValue = positions.reduce((sum: number, pos: any) => sum + (pos.side === 'long' ? (pos.sizeUSD || 0) : 0), 0)
    const shortValue = positions.reduce((sum: number, pos: any) => sum + (pos.side === 'short' ? (pos.sizeUSD || 0) : 0), 0)
    
    if (longValue >= shortValue) {
      return { percentage: (longValue / totalValue) * 100, isLong: true }
    } else {
      return { percentage: (shortValue / totalValue) * 100, isLong: false }
    }
  }

  const fetchWalletPositions = useCallback(async (walletAddress: string, txHash: string) => {
    try {
      // Mark this wallet as loading using txHash
      setTransfers(prev => prev.map(t => ({
        ...t,
        isLoadingBias: t.txHash === txHash ? true : t.isLoadingBias
      })))

      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: walletAddress
        })
      })

      if (!response.ok) throw new Error('Failed to fetch positions')
      
      const data = await response.json()
      console.log('Position data:', data)

      // Calculate position bias
      if (!data.assetPositions || data.assetPositions.length === 0) {
        // No positions case
        setTransfers(prev => prev.map(t => ({
          ...t,
          isLoadingBias: t.txHash === txHash ? false : t.isLoadingBias,
          positionBias: null,
          hasNoPositions: t.txHash === txHash ? true : t.hasNoPositions,
          positionCount: t.txHash === txHash ? 0 : t.positionCount
        })))
        return
      }

      const positions = data.assetPositions || []
      let longValue = 0
      let shortValue = 0

      positions.forEach((position: any) => {
        const side = position.position?.side || (parseFloat(position.position?.szi || '0') > 0 ? 'long' : 'short')
        const value = Math.abs(parseFloat(position.position?.sizeUsd || position.position?.positionValue || '0'))
        
        if (side === 'long') longValue += value
        else shortValue += value
      })

      const totalValue = longValue + shortValue
      const isLong = longValue > shortValue
      const percentage = totalValue === 0 ? 0 : Math.round((Math.max(longValue, shortValue) / totalValue) * 100)

      // Update the specific transfer with position bias using txHash
      setTransfers(prev => prev.map(t => ({
        ...t,
        isLoadingBias: t.txHash === txHash ? false : t.isLoadingBias,
        positionBias: t.txHash === txHash ? {
          isLong,
          percentage
        } : t.positionBias,
        positionCount: t.txHash === txHash ? positions.length : t.positionCount
      })))

    } catch (error) {
      console.error('Error fetching positions:', error)
      // Reset loading state on error using txHash
      setTransfers(prev => prev.map(t => ({
        ...t,
        isLoadingBias: t.txHash === txHash ? false : t.isLoadingBias
      })))
    }
  }, [])

  const calculateAllTimePnl = (tradeHistory: any[]): number => {
    if (!tradeHistory || !Array.isArray(tradeHistory) || tradeHistory.length === 0) {
      return 0
    }

    try {
      // Sum up realized PnL from all trades
      return tradeHistory.reduce((total: number, trade: any) => {
        const pnl = parseFloat(trade.realizedPnl || "0")
        return total + (isNaN(pnl) ? 0 : pnl)
      }, 0)
    } catch (error) {
      console.error('Error calculating all-time PnL:', error)
      return 0
    }
  }

  // Function to follow a wallet
  const followWallet = useCallback(async (address: string) => {
    try {
      setFollowLoading(address)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error("Not authenticated")
      
      // Check if already following
      const { data: existing } = await supabase
        .from('followed_wallets')
        .select()
        .eq('user_id', user.id)
        .eq('address', address)
        .single()
      
      if (existing) {
        toast({
          title: "Already Following",
          description: "You are already following this wallet",
          variant: "destructive"
        })
        return
      }

      // Get wallet name from transfers data
      const walletName = transfers.find(t => t.from === address)?.from || 
                       `Wallet ${address.substring(0, 6)}...${address.substring(address.length - 4)}`

      // Insert into database
      const { error: insertError } = await supabase
        .from('followed_wallets')
        .insert({
          user_id: user.id,
          address: address,
          name: walletName
        })

      if (insertError) throw insertError

      toast({
        title: "Wallet Followed",
        description: `Successfully followed ${walletName}`,
      })

      // Trigger sidebar update (we'll implement this next)
      window.dispatchEvent(new Event('walletFollowed'))

      router.push(`/dashboard/tool-3/wallet/${address}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to follow wallet. Please try again.",
        variant: "destructive"
      })
    } finally {
      setFollowLoading(null)
    }
  }, [router, supabase, transfers, toast])

  // Add effect for fetching 24h deposits data
  useEffect(() => {
    const fetchDeposits24h = async () => {
      try {
        // Calculate 24 hours ago
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
        
        // Filter transfers from the last 24 hours
        const recent = transfers.filter(t => t.timestamp >= oneDayAgo)
        
        // Calculate totals
        const deposits = recent
          .filter(t => t.type === 'deposit')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const withdrawals = recent
          .filter(t => t.type === 'withdrawal')
          .reduce((sum, t) => sum + t.amount, 0)
        
        setDeposits24h({
          total: deposits - withdrawals,
          deposits,
          withdrawals,
          lastUpdated: new Date().toLocaleString()
        })
      } catch (error) {
        console.error('Error calculating 24h deposits:', error)
      }
    }

    // Initial fetch
    fetchDeposits24h()

    // Set up hourly updates
    const interval = setInterval(fetchDeposits24h, 60 * 60 * 1000) // Every hour

    return () => clearInterval(interval)
  }, [transfers])

  // Filter transfers based on all active filters
  const filteredTransfers = transfers
    .filter(t => t.amount >= threshold)
    .filter(t => typeFilter === 'all' || t.type === typeFilter);

  return (
    <div className="space-y-6">
      {/* TEST HEADING - DELETE LATER */}
      <Card className="border-dashed border-yellow-500/50 bg-yellow-500/10">
        <CardHeader>
          <CardTitle className="text-yellow-500">Test Heading</CardTitle>
          <CardDescription className="text-yellow-500/80">
            24h Net Flow: {formatCurrency(deposits24h.total)}
            <div className="text-xs text-muted-foreground mt-1">
              Deposits: {formatCurrency(deposits24h.deposits)} | 
              Withdrawals: {formatCurrency(deposits24h.withdrawals)}
              <br />
              Last updated: {deposits24h.lastUpdated}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Click "Reveal" button to fetch wallet data
          </div>
          <div className="mt-4 text-sm">
            This card was added for testing purposes. Click the "Reveal" button in any row to see wallet data here.
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">24hr Deposit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(2400000)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">1hr Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(634000)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deposit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+{formatNumber(12)}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Buy/Sell</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(1200000)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Large Deposit Monitor</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter: {threshold >= 1000000 ? '$1M+' : `$${threshold / 1000}K`} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setThreshold(100000)}>$100K</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setThreshold(500000)}>$500K</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setThreshold(1000000)}>$1M+</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Integrated Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Type
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                          All
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTypeFilter('deposit')}>
                          Deposits Only
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTypeFilter('withdrawal')}>
                          Withdrawals Only
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
                <TableHead>30d PnL</TableHead>
                <TableHead>Positions</TableHead>
                <TableHead>Position Bias</TableHead>
                <TableHead>Follow</TableHead>
                <TableHead>Tx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.map((transfer, index) => (
                <TableRow key={transfer.txHash}>
                  <TableCell className="p-2 text-sm whitespace-nowrap">
                    {formatDate(transfer.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={`/dashboard/tool-2?address=${transfer.from}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      {`${transfer.from.slice(0, 6)}...${transfer.from.slice(-4)}`}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`px-2 py-1 font-semibold ${
                        transfer.type === 'deposit' 
                          ? 'bg-green-100/10 text-green-500 border-green-200/20'
                          : 'bg-red-100/10 text-red-500 border-red-200/20'
                      }`}
                    >
                      {formatCurrency(transfer.amount)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transfer.type === 'deposit' ? (
                      <div className="flex items-center text-green-500">
                        <ArrowDownToLine className="h-4 w-4 mr-1" />
                        Deposit
                      </div>
                    ) : (
                      <div className="flex items-center text-orange-500">
                        <ArrowUpFromLine className="h-4 w-4 mr-1" />
                        Withdraw
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="p-2 text-sm text-muted-foreground">
                    Coming soon
                  </TableCell>
                  <TableCell className="p-2 text-sm text-muted-foreground">
                    Coming soon
                  </TableCell>
                  <TableCell>
                    {transfer.positionBias ? (
                      <div className="flex flex-col gap-1">
                        <Badge 
                          variant="outline" 
                          className={`px-2 py-1 font-semibold ${
                            transfer.positionBias.isLong
                              ? 'bg-green-100/10 text-green-500 border-green-200/20'
                              : 'bg-red-100/10 text-red-500 border-red-200/20'
                          }`}
                        >
                          {Math.round(transfer.positionBias.percentage)}% {transfer.positionBias.isLong ? 'Long' : 'Short'}
                        </Badge>
                        <div className="text-xs text-muted-foreground pl-2">
                          {transfer.positionCount} active {transfer.positionCount === 1 ? 'position' : 'positions'}
                        </div>
                      </div>
                    ) : transfer.hasNoPositions ? (
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="px-2 py-1 font-semibold bg-muted/50 text-muted-foreground">
                          NO POSITION
                        </Badge>
                        <div className="text-xs text-muted-foreground pl-2">
                          0 active positions
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const walletAddress = transfer.from
                          console.log('Button clicked for transfer:', transfer)
                          console.log('Using wallet address:', walletAddress)
                          if (walletAddress) {
                            fetchWalletPositions(walletAddress, transfer.txHash)
                          } else {
                            console.error('No wallet address found in transfer:', transfer)
                          }
                        }}
                        disabled={transfer.isLoadingBias}
                      >
                        {transfer.isLoadingBias ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">Reveal position bias</span>
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => followWallet(transfer.from)}
                      disabled={followLoading === transfer.from}
                    >
                      {followLoading === transfer.from ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
                          Following...
                        </div>
                      ) : (
                        "Follow"
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const network = transfer.network as 'ARBITRUM' | 'ETHEREUM'
                        window.open(`${CONFIG[network].EXPLORER_URL}/tx/${transfer.txHash}`, '_blank')
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View transaction</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {transfers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="p-4 text-center text-sm text-muted-foreground">
                    No large transfers detected yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Follow Dialog */}
      <Dialog open={followDialogOpen} onOpenChange={setFollowDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Follow Trader</DialogTitle>
            <DialogDescription>
              Configure settings to copy trades from {selectedTrader?.nickname || "this wallet"}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wallet" className="text-right">
                Wallet
              </Label>
              <div className="col-span-3 font-mono text-sm">
                {selectedTrader?.wallet}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nickname" className="text-right">
                Nickname
              </Label>
              <Input
                id="nickname"
                defaultValue={selectedTrader?.nickname}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Copy Amount
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="USDC amount to copy with"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leverage" className="text-right">
                Leverage
              </Label>
              <Input
                id="leverage"
                type="number"
                defaultValue="1"
                min="1"
                max="10"
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
