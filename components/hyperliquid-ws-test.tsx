'use client'

import { useHyperliquidWs } from '@/hooks/use-hyperliquid-ws'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function HyperliquidWsTest() {
  const { isConnected, trades, lastMessage } = useHyperliquidWs()

  return (
    <Card className="col-span-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Hyperliquid WebSocket Test</CardTitle>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        <CardDescription>
          Real-time BTC trades via WebSocket
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Recent Trades</h3>
            <div className="mt-2 max-h-[200px] overflow-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-sm">Side</th>
                    <th className="text-left text-sm">Size</th>
                    <th className="text-left text-sm">Price</th>
                    <th className="text-left text-sm">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => (
                    <tr key={`${trade.oid}-${i}`}>
                      <td className={trade.side === 'B' ? 'text-green-500' : 'text-red-500'}>
                        {trade.side}
                      </td>
                      <td>{parseFloat(trade.sz).toFixed(4)}</td>
                      <td>${parseFloat(trade.px).toLocaleString()}</td>
                      <td>{new Date(trade.time).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium">Last Message</h3>
            <pre className="mt-2 max-h-[100px] overflow-auto rounded bg-secondary p-2 text-xs">
              {JSON.stringify(lastMessage, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
