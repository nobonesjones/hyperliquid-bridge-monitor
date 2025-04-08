'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { HyperliquidWalletLookup } from '@/components/hyperliquid-wallet-lookup'
import { TradeHistory } from '@/components/trade-history'
import { usePnLData } from '@/hooks/use-pnl-data'
import { Search } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function WalletLookupPage({
  searchParams
}: {
  searchParams: { address?: string }
}) {
  const [address, setAddress] = useState(searchParams.address || '')
  const [searchedAddress, setSearchedAddress] = useState(searchParams.address || '')
  const { data: pnlData, isLoading: isLoadingPnL } = usePnLData(searchedAddress)

  const handleSearch = () => {
    if (address) {
      setSearchedAddress(address)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Input
                placeholder="Enter wallet address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {searchedAddress && (
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
                      initialAddress={searchedAddress}
                      hideLookup={true}
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
        )}
      </div>
    </DashboardLayout>
  )
}
