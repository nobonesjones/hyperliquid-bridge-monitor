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
      <div className="text-sm text-gray-500">
        No trade history available
      </div>
    )
  }

  return (
    <div className="overflow-auto max-h-[400px] border border-gray-700 rounded-lg bg-gray-900">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Asset</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Side</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Size</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Avg. Price</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">PnL</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Count</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
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
                className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'} hover:bg-gray-700 transition-colors`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                  <div>{dateDisplay}</div>
                  <div className="text-gray-500">{timeDisplay}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                  {trade.coin}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                  trade.side === 'B' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trade.side === 'B' ? 'Buy' : 'Sell'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                  {trade.totalSize.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                  ${trade.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                  trade.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trade.totalPnl >= 0 ? '+' : ''} 
                  ${Math.round(trade.totalPnl).toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                  {trade.tradeCount}x
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="text-xs text-gray-500 p-2 border-t border-gray-700">
        Showing {trades.length} trade groups
      </div>
    </div>
  )
}
