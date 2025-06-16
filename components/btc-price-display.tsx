'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { getBTCPriceData, type BTCPriceData } from '@/lib/services/btc-price-service'
import { formatCurrency } from '@/lib/utils'

interface BTCPriceDisplayProps {
  className?: string
  showChange?: boolean
  showSource?: boolean
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

export function BTCPriceDisplay({ 
  className = '',
  showChange = true,
  showSource = false,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: BTCPriceDisplayProps) {
  const [priceData, setPriceData] = useState<BTCPriceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchPrice = async () => {
    try {
      setError(null)
      const data = await getBTCPriceData()
      setPriceData(data)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error fetching BTC price:', err)
      setError('Failed to fetch price')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchPrice()
  }, [])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchPrice, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500'
    if (change < 0) return 'text-red-500'
    return 'text-gray-500'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />
    if (change < 0) return <TrendingDown className="h-3 w-3" />
    return null
  }

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'coingecko': return 'default'
      case 'hyperliquid': return 'secondary'
      case 'cache': return 'outline'
      default: return 'outline'
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading BTC price...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !priceData) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-sm text-red-500">
            {error || 'Unable to load BTC price'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              {formatCurrency(priceData.price)}
            </div>
            {showChange && priceData.change24h !== undefined && (
              <div className={`flex items-center space-x-1 text-sm ${getChangeColor(priceData.change24h)}`}>
                {getChangeIcon(priceData.change24h)}
                <span>
                  {priceData.change24h > 0 ? '+' : ''}{priceData.change24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            {showSource && (
              <Badge variant={getSourceBadgeVariant(priceData.source)} className="text-xs">
                {priceData.source}
              </Badge>
            )}
            {lastUpdate && (
              <div className="text-xs text-muted-foreground">
                {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground">
          Bitcoin (BTC)
          {priceData.volume24h && (
            <span className="ml-2">
              Vol: {formatCurrency(priceData.volume24h, 0)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 