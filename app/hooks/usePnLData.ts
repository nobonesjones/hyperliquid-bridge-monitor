import { useState, useEffect } from 'react'

interface PnLData {
  totalPnl: number
  last24h: number
  last7d: number
  last30d: number
  groupedTrades: {
    startTime: number
    endTime: number
    coin: string
    side: string
    totalSize: number
    avgPrice: number
    totalPnl: number
    tradeCount: number
  }[]
}

export function usePnLData(address: string) {
  const [data, setData] = useState<PnLData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!address) {
        setError('Address is required')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/hyperliquid/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address })
        })

        if (!response.ok) {
          throw new Error('Failed to fetch PnL data')
        }

        const result = await response.json()
        if (result.error) {
          throw new Error(result.error)
        }

        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch PnL data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [address])

  return { data, isLoading, error }
}
