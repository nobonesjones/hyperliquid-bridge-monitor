'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { blockchainMonitor, CONFIG } from '@/lib/services/blockchain-monitor'
import { ExternalLink, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'

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
}

export function BlockchainMonitorTest() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    async function initializeMonitor() {
      const success = await blockchainMonitor.initialize()
      setIsInitialized(success)
      if (success) {
        // Initial check
        const initialTransfers = await blockchainMonitor.checkForTransfers()
        setTransfers(initialTransfers)
        setLastUpdate(new Date())
      }
    }

    initializeMonitor()

    // Set up polling
    const interval = setInterval(async () => {
      if (isInitialized) {
        const newTransfers = await blockchainMonitor.checkForTransfers()
        setTransfers(newTransfers)
        setLastUpdate(new Date())
      }
    }, CONFIG.POLLING_INTERVAL)

    return () => clearInterval(interval)
  }, [isInitialized])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  return (
    <div className="w-full col-span-full">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Hyperliquid Bridge Activity</CardTitle>
            <Badge variant={isInitialized ? "default" : "destructive"}>
              {isInitialized ? 'Monitoring' : 'Initializing'}
            </Badge>
          </div>
          <CardDescription>
            Monitoring transfers ≥ ${CONFIG.LARGE_AMOUNT_THRESHOLD.toLocaleString()} USDC
            {lastUpdate && ` • Last update: ${lastUpdate.toLocaleTimeString()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border w-full">
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="p-2 text-left text-sm">Time</th>
                    <th className="p-2 text-left text-sm">From</th>
                    <th className="p-2 text-left text-sm">Amount</th>
                    <th className="p-2 text-left text-sm">Type</th>
                    <th className="p-2 text-left text-sm">Token</th>
                    <th className="p-2 text-left text-sm">30d PnL</th>
                    <th className="p-2 text-left text-sm">Positions</th>
                    <th className="p-2 text-left text-sm">Actions</th>
                    <th className="p-2 text-left text-sm">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer, i) => (
                    <tr key={`${transfer.txHash}-${i}`} className="border-b">
                      <td className="p-2 text-sm whitespace-nowrap">
                        {formatDate(transfer.timestamp)}
                      </td>
                      <td className="p-2 text-sm font-mono">
                        <a 
                          href={`${transfer.explorerUrl}/address/${transfer.from}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {`${transfer.from.slice(0, 6)}...${transfer.from.slice(-4)}`}
                        </a>
                      </td>
                      <td className="p-2 text-sm">
                        ${transfer.amount.toLocaleString()}
                      </td>
                      <td className="p-2 text-sm">
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
                      </td>
                      <td className="p-2 text-sm">{transfer.token}</td>
                      <td className="p-2 text-sm text-muted-foreground">
                        Coming soon
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        Coming soon
                      </td>
                      <td className="p-2 text-sm">
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3">
                          Follow
                        </button>
                      </td>
                      <td className="p-2 text-sm">
                        <a 
                          href={`${transfer.explorerUrl}/tx/${transfer.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {transfers.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-sm text-muted-foreground">
                        No large transfers detected yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
