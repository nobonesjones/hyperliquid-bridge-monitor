'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface LargeDeposit {
  coin: string
  side: 'B' | 'S'
  sz: string
  px: string
  time: number
  oid: string
  uid: string
  usdValue: number
}

const DEPOSIT_THRESHOLD = 100000 // $100K USD
const HOURS_LOOKBACK = 24
const MS_PER_HOUR = 60 * 60 * 1000
const COINS = {
  BTC: 'BTC',
  USDT: 'USDC' // Hyperliquid uses USDC market
}

async function fetchHistoricalDeposits(coin: string): Promise<LargeDeposit[]> {
  try {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: "recentTrades",
        coin,
        limit: 5000 // Increased limit to get more historical data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const cutoffTime = Date.now() - (HOURS_LOOKBACK * MS_PER_HOUR)

    // Filter for large buy orders in the last 24 hours
    return data
      .filter((trade: any) => {
        const usdValue = parseFloat(trade.sz) * parseFloat(trade.px)
        return trade.time >= cutoffTime && 
               trade.side === 'B' && 
               usdValue >= DEPOSIT_THRESHOLD
      })
      .map((trade: any) => ({
        ...trade,
        coin: coin === COINS.USDT ? 'USDT' : coin,
        usdValue: parseFloat(trade.sz) * parseFloat(trade.px)
      }))
  } catch (error) {
    console.error('Error fetching historical deposits:', error)
    return []
  }
}

export function DepositMonitor() {
  const [deposits, setDeposits] = useState<LargeDeposit[]>([])
  const [btcConnected, setBtcConnected] = useState(false)
  const [usdtConnected, setUsdtConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load historical data
  useEffect(() => {
    async function loadHistoricalData() {
      setIsLoading(true)
      try {
        const [btcDeposits, usdtDeposits] = await Promise.all([
          fetchHistoricalDeposits(COINS.BTC),
          fetchHistoricalDeposits(COINS.USDT)
        ])

        // Combine and sort by time
        const allDeposits = [...btcDeposits, ...usdtDeposits]
          .sort((a, b) => b.time - a.time)

        setDeposits(allDeposits)
      } catch (error) {
        console.error('Error loading historical data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistoricalData()
  }, [])

  // WebSocket connection for live updates
  useEffect(() => {
    const connections = Object.values(COINS).map(coin => {
      const ws = new WebSocket('wss://api.hyperliquid.xyz/ws')

      ws.onopen = () => {
        console.log(`Connected to ${coin} WebSocket`)
        if (coin === COINS.BTC) setBtcConnected(true)
        if (coin === COINS.USDT) setUsdtConnected(true)

        // Subscribe to trades
        const subscribeMsg = {
          method: 'subscribe',
          subscription: {
            type: 'trades',
            coin
          }
        }
        ws.send(JSON.stringify(subscribeMsg))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.channel === 'trades' && data.data) {
            const trade = data.data
            const usdValue = parseFloat(trade.sz) * parseFloat(trade.px)
            
            // Only track large deposits
            if (usdValue >= DEPOSIT_THRESHOLD && trade.side === 'B') {
              const deposit: LargeDeposit = {
                ...trade,
                coin: coin === COINS.USDT ? 'USDT' : coin, // Map back to display name
                usdValue
              }
              
              setDeposits(prev => {
                const newDeposits = [deposit, ...prev]
                // Keep only last 50 deposits
                return newDeposits.slice(0, 50)
              })
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error(`${coin} WebSocket error:`, error)
        if (coin === COINS.BTC) setBtcConnected(false)
        if (coin === COINS.USDT) setUsdtConnected(false)
      }

      ws.onclose = () => {
        console.log(`${coin} WebSocket connection closed`)
        if (coin === COINS.BTC) setBtcConnected(false)
        if (coin === COINS.USDT) setUsdtConnected(false)
      }

      return ws
    })

    // Cleanup
    return () => {
      connections.forEach(ws => ws.close())
    }
  }, [])

  return (
    <Card className="col-span-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Large Deposits Monitor</CardTitle>
          <div className="flex gap-2">
            <Badge variant={btcConnected ? "default" : "destructive"}>
              BTC {btcConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Badge variant={usdtConnected ? "default" : "destructive"}>
              USDT {usdtConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {isLoading ? 'Loading historical deposits...' : (
            `Showing deposits ≥ $${DEPOSIT_THRESHOLD.toLocaleString()} from the last ${HOURS_LOOKBACK} hours`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-md border">
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="p-2 text-left text-sm">Time</th>
                    <th className="p-2 text-left text-sm">Coin</th>
                    <th className="p-2 text-left text-sm">Amount</th>
                    <th className="p-2 text-left text-sm">USD Value</th>
                    <th className="p-2 text-left text-sm">Wallet</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((deposit, i) => (
                    <tr key={`${deposit.oid}-${i}`} className="border-b">
                      <td className="p-2 text-sm">
                        {formatDistanceToNow(deposit.time, { addSuffix: true })}
                      </td>
                      <td className="p-2 text-sm">{deposit.coin}</td>
                      <td className="p-2 text-sm">
                        {parseFloat(deposit.sz).toFixed(4)}
                      </td>
                      <td className="p-2 text-sm">
                        ${deposit.usdValue.toLocaleString()}
                      </td>
                      <td className="p-2 text-sm font-mono">
                        {`${deposit.uid.slice(0, 6)}...${deposit.uid.slice(-4)}`}
                      </td>
                    </tr>
                  ))}
                  {deposits.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-sm text-muted-foreground">
                        No large deposits in the last hour
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
