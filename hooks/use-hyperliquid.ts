import { useState, useEffect } from 'react'
import { hyperliquid, Deposit, TraderInfo } from '@/lib/services/hyperliquid'

interface UseHyperliquidReturn {
  deposits: Deposit[]
  volume24h: number | null
  volume1h: number | null
  isLoading: boolean
  error: Error | null
  traderInfo: { [wallet: string]: TraderInfo }
  refreshData: () => Promise<void>
}

export function useHyperliquid(threshold: number = 100000): UseHyperliquidReturn {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [volume24h, setVolume24h] = useState<number | null>(null)
  const [volume1h, setVolume1h] = useState<number | null>(null)
  const [traderInfo, setTraderInfo] = useState<{ [wallet: string]: TraderInfo }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch initial data
  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch deposits and volumes in parallel
      const [depositsData, volume24hData, volume1hData] = await Promise.all([
        hyperliquid.getRecentDeposits(threshold),
        hyperliquid.get24hVolume(),
        hyperliquid.get1hDeposits()
      ])

      setDeposits(depositsData)
      setVolume24h(volume24hData)
      setVolume1h(volume1hData)

      // Fetch trader info for each unique wallet
      const uniqueWallets = Array.from(new Set(depositsData.map(d => d.wallet)))
      const traderInfoPromises = uniqueWallets.map(wallet => 
        hyperliquid.getTraderInfo(wallet)
          .then(info => ({ wallet, info }))
          .catch(() => null) // Ignore individual trader info failures
      )

      const traderInfoResults = await Promise.all(traderInfoPromises)
      const traderInfoMap = traderInfoResults.reduce((acc, result) => {
        if (result) {
          acc[result.wallet] = result.info
        }
        return acc
      }, {} as { [wallet: string]: TraderInfo })

      setTraderInfo(traderInfoMap)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }

  // Set up WebSocket connection
  useEffect(() => {
    const handleMessage = (data: any) => {
      if (data.type === 'deposit' && data.amount >= threshold) {
        setDeposits(prev => [data, ...prev].slice(0, 50)) // Keep last 50 deposits
        
        // Update volumes
        if (data.direction === 'in') {
          setVolume24h(prev => (prev || 0) + data.amount)
          setVolume1h(prev => (prev || 0) + data.amount)
        }

        // Fetch trader info for new wallet
        hyperliquid.getTraderInfo(data.wallet)
          .then(info => {
            setTraderInfo(prev => ({
              ...prev,
              [data.wallet]: info
            }))
          })
          .catch(console.error) // Log but don't break the app
      }
    }

    // Connect to WebSocket
    hyperliquid.connect(handleMessage)

    // Initial data fetch
    fetchData()

    // Cleanup
    return () => {
      hyperliquid.disconnect()
    }
  }, [threshold])

  return {
    deposits,
    volume24h,
    volume1h,
    isLoading,
    error,
    traderInfo,
    refreshData: fetchData
  }
}
