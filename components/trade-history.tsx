interface Trade {
  startTime: number
  endTime: number
  coin: string
  side: string
  totalSize: number
  avgPrice: number
  totalPnl: number
  tradeCount: number
}

interface TradeHistoryProps {
  trades: Trade[]
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  if (!trades?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No trade history available
      </div>
    )
  }

  return (
    <div className="overflow-auto max-h-[400px] border rounded-lg bg-background">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Side</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Price</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">PnL</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Count</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {trades.map((trade, index) => {
            const startDate = new Date(trade.startTime)
            const endDate = new Date(trade.endTime)
            const timeDisplay = startDate.toLocaleTimeString() + 
              (startDate.getTime() !== endDate.getTime() ? 
                ' - ' + endDate.toLocaleTimeString() : '')
            const dateDisplay = startDate.toLocaleDateString()

            return (
              <tr 
                key={`${trade.startTime}-${trade.coin}-${trade.side}`}
                className={`${index % 2 === 0 ? 'bg-background' : 'bg-muted/50'} hover:bg-muted/80 transition-colors`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="text-foreground">{dateDisplay}</div>
                  <div className="text-muted-foreground">{timeDisplay}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                  {trade.coin}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                  trade.side === 'B' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {trade.side === 'B' ? 'Buy' : 'Sell'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                  {trade.totalSize.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                  ${trade.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                  trade.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {trade.totalPnl >= 0 ? '+' : ''} 
                  ${Math.round(trade.totalPnl).toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-muted-foreground">
                  {trade.tradeCount}x
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="text-xs text-muted-foreground p-2 border-t border-border">
        Showing {trades.length} trade groups
      </div>
    </div>
  )
}
