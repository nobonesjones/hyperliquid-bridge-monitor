'use client'

import { useHyperliquid } from '@/hooks/use-hyperliquid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function HyperliquidTest() {
  const {
    deposits,
    volume24h,
    volume1h,
    isLoading,
    error,
    traderInfo,
    refreshData
  } = useHyperliquid(100000) // Monitor deposits over $100k

  if (error) {
    return (
      <Card className="bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">Connection Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error.message}</p>
          <Button onClick={refreshData} className="mt-4">
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Hyperliquid Connection Status
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={isLoading}
            >
              Refresh Data
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Status: {isLoading ? 'Loading...' : 'Connected'}</p>
            <p>24h Volume: ${volume24h?.toLocaleString() ?? 'Loading...'}</p>
            <p>1h Volume: ${volume1h?.toLocaleString() ?? 'Loading...'}</p>
            <p>Recent Deposits: {deposits.length}</p>
            <p>Tracked Wallets: {Object.keys(traderInfo).length}</p>
          </div>
        </CardContent>
      </Card>

      {deposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Deposit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Transaction: {deposits[0].transaction}</p>
              <p>Wallet: {deposits[0].wallet}</p>
              <p>Amount: ${deposits[0].amount.toLocaleString()}</p>
              <p>Direction: {deposits[0].direction.toUpperCase()}</p>
              {traderInfo[deposits[0].wallet] && (
                <>
                  <p>7d PnL: {traderInfo[deposits[0].wallet].pnl7d}%</p>
                  <p>30d PnL: {traderInfo[deposits[0].wallet].pnl30d}%</p>
                  <p>Open Positions: {traderInfo[deposits[0].wallet].openPositions}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
