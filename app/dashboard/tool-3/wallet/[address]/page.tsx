'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { HyperliquidWalletLookup } from '@/components/hyperliquid-wallet-lookup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TradeHistory } from '@/components/trade-history'
import { usePnLData } from '@/hooks/use-pnl-data'
import { Pencil, Check, X } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function SavedWalletPage({
  params
}: {
  params: { address: string }
}) {
  const router = useRouter()
  const [walletName, setWalletName] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const { data: pnlData, isLoading: isLoadingPnL } = usePnLData(params.address)

  // Fetch the current wallet name
  useEffect(() => {
    async function fetchWalletName() {
      const { data, error } = await supabase
        .from('followed_wallets')
        .select('name')
        .eq('address', params.address)
        .single()

      if (error) {
        console.error('Error fetching wallet name:', error)
        return
      }

      if (data) {
        setWalletName(data.name)
      }
    }

    fetchWalletName()
  }, [params.address, supabase])

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('followed_wallets')
        .update({ name: walletName })
        .eq('address', params.address)
        .eq('user_id', user.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Wallet name updated successfully",
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating wallet name:', error)
      toast({
        title: "Error",
        description: "Failed to update wallet name",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnfollow = async () => {
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

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
        .eq('address', params.address)
        .eq('user_id', user.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Wallet unfollowed successfully",
      })

      // Find the next wallet to navigate to
      if (followedWallets) {
        const currentIndex = followedWallets.findIndex(w => w.address === params.address)
        const nextWallet = followedWallets[currentIndex + 1] || followedWallets[currentIndex - 1]

        if (nextWallet) {
          // Navigate to the next wallet in the list
          router.push(`/dashboard/tool-3/wallet/${nextWallet.address}`)
        } else {
          // No other wallets, go to dashboard
          router.push('/dashboard/tool-3')
        }
      }
    } catch (error) {
      console.error('Error unfollowing wallet:', error)
      toast({
        title: "Error",
        description: "Failed to unfollow wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={walletName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWalletName(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-0 border-b border-border rounded-none px-0 h-auto focus-visible:ring-0 focus-visible:border-primary"
                  placeholder="Enter wallet name"
                />
                <Button 
                  size="icon"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-2xl font-bold">{walletName || 'Unnamed Wallet'}</h1>
                  <p className="text-sm text-muted-foreground font-mono">{params.address}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <Button
            variant="destructive"
            onClick={handleUnfollow}
            disabled={isLoading}
          >
            Unfollow
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Account Summary Section */}
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
              <CardDescription>Overview of wallet performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardDescription>Total PnL</CardDescription>
                    <CardTitle className={pnlData?.totalPnl && pnlData.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {isLoadingPnL ? '...' : (
                        `${pnlData?.totalPnl && pnlData.totalPnl >= 0 ? '+' : ''}$${Math.round(pnlData?.totalPnl || 0).toLocaleString()}`
                      )}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="p-4">
                    <CardDescription>24h PnL</CardDescription>
                    <CardTitle className={pnlData?.last24h && pnlData.last24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {isLoadingPnL ? '...' : (
                        `${pnlData?.last24h && pnlData.last24h >= 0 ? '+' : ''}$${Math.round(pnlData?.last24h || 0).toLocaleString()}`
                      )}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="p-4">
                    <CardDescription>7d PnL</CardDescription>
                    <CardTitle className={pnlData?.last7d && pnlData.last7d >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {isLoadingPnL ? '...' : (
                        `${pnlData?.last7d && pnlData.last7d >= 0 ? '+' : ''}$${Math.round(pnlData?.last7d || 0).toLocaleString()}`
                      )}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="p-4">
                    <CardDescription>30d PnL</CardDescription>
                    <CardTitle className={pnlData?.last30d && pnlData.last30d >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {isLoadingPnL ? '...' : (
                        `${pnlData?.last30d && pnlData.last30d >= 0 ? '+' : ''}$${Math.round(pnlData?.last30d || 0).toLocaleString()}`
                      )}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="positions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="positions">Open Positions</TabsTrigger>
              <TabsTrigger value="history">Trade History</TabsTrigger>
            </TabsList>

            <TabsContent value="positions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Open Positions</CardTitle>
                  <CardDescription>Current active trades</CardDescription>
                </CardHeader>
                <CardContent>
                  <HyperliquidWalletLookup 
                    initialAddress={params.address}
                    hideLookup={true}
                    hideButtons={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trade History</CardTitle>
                  <CardDescription>Recent trades grouped by 5-minute intervals</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPnL ? (
                    <div className="text-sm text-muted-foreground">Loading trade history...</div>
                  ) : (
                    <TradeHistory trades={pnlData?.groupedTrades || []} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}
