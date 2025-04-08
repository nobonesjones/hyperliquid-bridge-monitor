'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { hyperliquidAPI } from '@/lib/services/hyperliquid'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from "@/components/ui/use-toast"

interface CumulativeFunding {
  allTime: number;
  sinceChange: number;
  sinceOpen: number;
}

interface Position {
  coin: string
  position: number
  entryPrice: number
  unrealizedPnl: number
  leverage: number
  liquidationPrice: number
  margin: number
  positionValue: number
  returnOnEquity: number
  maxLeverage: number
  cumFunding: CumulativeFunding
  currentFunding: number
  markPrice: number
  side: 'long' | 'short'
  sizeUSD: number
  health: number
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

export interface HyperliquidWalletLookupProps {
  initialAddress?: string
  hideLookup?: boolean
  isFollowed?: boolean
  onUnfollow?: () => void
  hideButtons?: boolean
}

export function HyperliquidWalletLookup({ initialAddress, hideLookup, isFollowed, onUnfollow, hideButtons }: HyperliquidWalletLookupProps) {
  const [address, setAddress] = useState(initialAddress || '')
  const [isLoading, setIsLoading] = useState(false)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<keyof Position | ''>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [followLoading, setFollowLoading] = useState<boolean>(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (initialAddress) {
      handleLookup(initialAddress)
    }
  }, [initialAddress])

  const handleLookup = async (addressToLookup: string) => {
    if (!addressToLookup) return
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await hyperliquidAPI.getWalletPositions(addressToLookup)
      setWalletData(data)
    } catch (err) {
      setError('Error fetching wallet data. Please check the address and try again.')
      setWalletData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (field: keyof Position) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortedPositions = () => {
    if (!walletData || !sortField) return walletData?.positions || []
    
    return [...walletData.positions].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return 0
    })
  }

  const calculatePositionBias = (positions: Position[]) => {
    if (positions.length === 0) return { percentage: 0, isLong: true }
    
    const longCount = positions.filter(pos => pos.side === 'long').length
    const shortCount = positions.filter(pos => pos.side === 'short').length
    
    if (longCount >= shortCount) {
      const percentage = (longCount / positions.length) * 100
      return { percentage, isLong: true }
    } else {
      const percentage = (shortCount / positions.length) * 100
      return { percentage, isLong: false }
    }
  }

  const SortIcon = ({ field }: { field: keyof Position }) => {
    if (sortField !== field) return <ChevronDown className="ml-1 h-4 w-4 inline text-muted-foreground/50" />
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4 inline text-green-500" />
      : <ChevronDown className="ml-1 h-4 w-4 inline text-green-500" />
  }

  const followWallet = async (address: string) => {
    setFollowLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to follow wallets",
          variant: "destructive"
        })
        return
      }

      const { error } = await supabase
        .from('followed_wallets')
        .insert([
          { user_id: user.id, address: address }
        ])

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Already Following",
            description: "You are already following this wallet",
            variant: "destructive"
          })
        } else {
          console.error('Error following wallet:', error)
          toast({
            title: "Error",
            description: "Failed to follow wallet. Please try again.",
            variant: "destructive"
          })
        }
        return
      }

      toast({
        title: "Success",
        description: "Wallet added to your watchlist"
      })

      // Redirect to the saved wallet page
      window.location.href = `/dashboard/tool-3/wallet/${address}`

    } catch (err) {
      console.error('Error following wallet:', err)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setFollowLoading(false)
    }
  }

  const unfollowWallet = async (address: string) => {
    setFollowLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to unfollow wallets",
          variant: "destructive"
        })
        return
      }

      // Get the list of followed wallets before unfollowing
      const { data: followedWallets } = await supabase
        .from('followed_wallets')
        .select('address')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Remove the current wallet
      const { error } = await supabase
        .from('followed_wallets')
        .delete()
        .eq('user_id', user.id)
        .eq('address', address)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to unfollow wallet. Please try again.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Success",
        description: "Wallet removed from your watchlist"
      })

      // Find the next wallet to navigate to
      if (followedWallets) {
        const currentIndex = followedWallets.findIndex(w => w.address === address)
        const nextWallet = followedWallets[currentIndex + 1] || followedWallets[currentIndex - 1]

        if (nextWallet) {
          // Navigate to the next wallet in the list
          window.location.href = `/dashboard/tool-3/wallet/${nextWallet.address}`
        } else {
          // No other wallets, go to dashboard
          window.location.href = '/dashboard/tool-3'
        }
      }

      // Call the onUnfollow callback if provided
      if (onUnfollow) {
        onUnfollow()
      }
    } catch (err) {
      console.error('Error unfollowing wallet:', err)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setFollowLoading(false)
    }
  }

  return (
    <div className="grid gap-4">
      {!hideLookup && (
        <Card>
          <CardContent className="flex flex-col space-y-1.5 p-6">
            <div className="flex gap-4">
              <Input
                placeholder="Enter wallet address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => handleLookup(address)} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading
                  </>
                ) : (
                  'Look Up'
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {walletData && (
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
                {!hideButtons && (
                  isFollowed ? (
                    <Button 
                      variant="destructive" 
                      onClick={() => unfollowWallet(walletData.address)}
                      disabled={followLoading}
                    >
                      {followLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Unfollowing...
                        </>
                      ) : (
                        'Unfollow'
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => followWallet(walletData.address)}
                      disabled={followLoading}
                    >
                      {followLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Following...
                        </>
                      ) : (
                        'Follow'
                      )}
                    </Button>
                  )
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(walletData.freeMargin + walletData.totalUnrealizedPnl)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unrealized PnL</p>
                  <p className={`text-2xl font-bold ${walletData.totalUnrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(walletData.totalUnrealizedPnl)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Position Bias</p>
                  {walletData.positions.length > 0 ? (
                    <div>
                      <p className={`text-2xl font-bold ${calculatePositionBias(walletData.positions).isLong ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.round(calculatePositionBias(walletData.positions).percentage)}%
                        <span className="text-sm font-normal ml-1">
                          {calculatePositionBias(walletData.positions).isLong ? 'Long' : 'Short'}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {walletData.positions.length} Position{walletData.positions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-muted-foreground">No Positions</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Free Margin</p>
                  <p className="text-2xl font-bold">{formatCurrency(walletData.freeMargin)}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Portfolio Delta</p>
                <p className={`text-2xl font-bold ${walletData.portfolioDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(walletData.portfolioDelta)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {walletData.portfolioDelta >= 0 ? 'Net Long' : 'Net Short'}
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
                      </tr>
                    ))}
                    {walletData.positions.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-sm text-muted-foreground">
                          No open positions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
