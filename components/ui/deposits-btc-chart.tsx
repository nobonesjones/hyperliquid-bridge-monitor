import React, { useState, useEffect } from 'react'
import { 
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { getHistoricalBTCPrices } from '@/lib/services/btc-price-service'

interface DepositsBTCChartProps {
  depositsData: Array<{
    timestamp: number
    cumulativeDeposits: number
    depositCount: number
    hourlyNetFlow?: number
    hourlyDeposits?: number
    hourlyWithdrawals?: number
    date: string
  }>
  isLoading?: boolean
}

interface BTCPricePoint {
  timestamp: number
  price: number
}

interface ChartDataPoint {
  timestamp: number
  cumulativeDeposits: number
  btcPrice: number
  depositCount: number
  hourlyNetFlow?: number
  hourlyDeposits?: number
  hourlyWithdrawals?: number
  date: string
}

export function DepositsBTCChart({ 
  depositsData, 
  isLoading = false 
}: DepositsBTCChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24H')
  const [btcData, setBtcData] = useState<BTCPricePoint[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [btcLoading, setBtcLoading] = useState(false)

  // Fetch BTC price data using our new service
  const fetchBTCPrices = async (timeframe: string) => {
    setBtcLoading(true)
    try {
      console.log('📈 Fetching BTC prices for chart, timeframe:', timeframe);
      
      // Map timeframe to our service format
      const timeframeMap: { [key: string]: '15m' | '1h' | '4h' | '12h' | '24h' | '7d' | '30d' } = {
        '15M': '15m',
        '1H': '1h', 
        '4H': '4h',
        '12H': '12h',
        '24H': '24h',
        '1W': '7d',
        '1M': '30d'
      }
      const serviceTimeframe = timeframeMap[timeframe] || '24h'
      
      // Use our new BTC price service
      const historicalPrices = await getHistoricalBTCPrices(serviceTimeframe)
      
      console.log('✅ Got historical prices:', historicalPrices.length, 'points');
      
      // Convert to the format expected by the chart
      const prices: BTCPricePoint[] = historicalPrices.map(({ timestamp, price }) => ({
        timestamp,
        price
      }))

      setBtcData(prices)
      
    } catch (error) {
      console.error('❌ Error fetching BTC prices for chart:', error)
      // Use mock data if API fails
      const mockPrices = generateMockBTCData(timeframe)
      setBtcData(mockPrices)
    } finally {
      setBtcLoading(false)
    }
  }

  // Generate mock BTC data if API fails
  const generateMockBTCData = (timeframe: string): BTCPricePoint[] => {
    const now = Date.now()
    const basePrice = 105000 // Mock BTC price
    
    let points: number
    let interval: number
    
    switch (timeframe) {
      case '15M':
        points = 24 // 6 hours of data
        interval = 15 * 60 * 1000 // 15 minutes
        break
      case '1H':
        points = 12 // 12 hours of data
        interval = 60 * 60 * 1000 // 1 hour
        break
      case '4H':
        points = 6 // 24 hours of data
        interval = 4 * 60 * 60 * 1000 // 4 hours
        break
      case '12H':
        points = 4 // 48 hours of data
        interval = 12 * 60 * 60 * 1000 // 12 hours
        break
      case '24H':
        points = 24
        interval = 60 * 60 * 1000 // 1 hour
        break
      case '1W':
        points = 7
        interval = 24 * 60 * 60 * 1000 // 1 day
        break
      case '1M':
        points = 30
        interval = 24 * 60 * 60 * 1000 // 1 day
        break
      default:
        points = 24
        interval = 60 * 60 * 1000
    }

    return Array.from({ length: points }, (_, i) => ({
      timestamp: now - (points - 1 - i) * interval,
      price: basePrice + (Math.random() - 0.5) * 2000 // ±$1000 variation
    }))
  }

  // Merge deposits and BTC data
  useEffect(() => {
    if (depositsData.length === 0 || btcData.length === 0) return

    const merged: ChartDataPoint[] = depositsData.map(deposit => {
      // Find closest BTC price by timestamp
      const closestBTC = btcData.reduce((prev, curr) => 
        Math.abs(curr.timestamp - deposit.timestamp) < Math.abs(prev.timestamp - deposit.timestamp) 
          ? curr : prev
      )

      return {
        ...deposit,
        btcPrice: closestBTC.price
      }
    })

    setChartData(merged)
  }, [depositsData, btcData])

  // Fetch BTC data when timeframe changes
  useEffect(() => {
    fetchBTCPrices(selectedTimeframe)
  }, [selectedTimeframe])

  // Calculate correlation coefficient
  const calculateCorrelation = (): number => {
    if (chartData.length < 2) return 0

    const deposits = chartData.map(d => d.cumulativeDeposits)
    const prices = chartData.map(d => d.btcPrice)

    const n = deposits.length
    const sumX = deposits.reduce((a, b) => a + b, 0)
    const sumY = prices.reduce((a, b) => a + b, 0)
    const sumXY = deposits.reduce((sum, x, i) => sum + x * prices[i], 0)
    const sumX2 = deposits.reduce((sum, x) => sum + x * x, 0)
    const sumY2 = prices.reduce((sum, y) => sum + y * y, 0)

    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return isNaN(correlation) ? 0 : correlation
  }

  const correlation = calculateCorrelation()
  const currentDeposits = chartData[chartData.length - 1]?.cumulativeDeposits || 0
  const currentBTC = chartData[chartData.length - 1]?.btcPrice || 0
  const isNetPositive = currentDeposits >= 0

  // Calculate dynamic BTC price domain for better volatility visualization
  const getBTCPriceDomain = (): [number, number] => {
    if (chartData.length === 0) return [100000, 110000] // fallback
    
    const prices = chartData.map(d => d.btcPrice)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice
    
    // If the range is very small (less than 1%), add padding
    const minPadding = Math.max(priceRange * 0.2, minPrice * 0.02) // 20% of range or 2% of price
    const maxPadding = Math.max(priceRange * 0.2, maxPrice * 0.02)
    
    const domainMin = Math.max(0, minPrice - minPadding)
    const domainMax = maxPrice + maxPadding
    
    console.log('📊 BTC Price Domain:', {
      minPrice: minPrice.toFixed(0),
      maxPrice: maxPrice.toFixed(0),
      range: priceRange.toFixed(0),
      domainMin: domainMin.toFixed(0),
      domainMax: domainMax.toFixed(0)
    })
    
    return [domainMin, domainMax]
  }

  const btcDomain = getBTCPriceDomain()

  const getCorrelationColor = (corr: number) => {
    if (corr > 0.3) return 'text-green-500'
    if (corr < -0.3) return 'text-red-500'
    return 'text-yellow-500'
  }

  const getTimeframeLabel = (timeframe: string): string => {
    switch (timeframe) {
      case '15M': return '15M'
      case '1H': return '1H'
      case '4H': return '4H'
      case '12H': return '12H'
      case '24H': return '24H'
      case '1W': return '1W'
      case '1M': return '1M'
      default: return '24H'
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const netFlow = payload.find((p: any) => p.dataKey === 'cumulativeDeposits')?.value || 0
      const btcPrice = payload.find((p: any) => p.dataKey === 'btcPrice')?.value || 0
      const dataPoint = payload[0]?.payload
      
      const hourlyNet = dataPoint?.hourlyNetFlow || 0
      const hourlyDeposits = dataPoint?.hourlyDeposits || 0
      const hourlyWithdrawals = dataPoint?.hourlyWithdrawals || 0
      const count = dataPoint?.depositCount || 0

      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`text-sm font-semibold ${netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            Cumulative Net Flow: {formatCurrency(netFlow)}
          </p>
          <p className="text-sm font-semibold text-orange-500">
            BTC Price: {formatCurrency(btcPrice)}
          </p>
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">This Hour:</p>
            <p className={`text-xs font-medium ${hourlyNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              Net Flow: {formatCurrency(hourlyNet)}
            </p>
            <p className="text-xs text-green-600">
              Deposits: {formatCurrency(hourlyDeposits)}
            </p>
            <p className="text-xs text-red-600">
              Withdrawals: {formatCurrency(hourlyWithdrawals)}
            </p>
            <p className="text-xs text-muted-foreground">
              Transactions: {count}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (isLoading || btcLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with timeframe selection */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            {getTimeframeLabel(selectedTimeframe)} Net Deposits vs BTC Price
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className={`text-lg font-bold ${currentDeposits >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(currentDeposits)}
            </div>
            <div className="text-lg font-bold text-orange-500">
              {formatCurrency(currentBTC)}
              <span className="text-xs text-muted-foreground ml-2">
                (Range: {formatCurrency(btcDomain[0], 0)} - {formatCurrency(btcDomain[1], 0)})
              </span>
            </div>
            <div className={`text-sm font-medium ${getCorrelationColor(correlation)}`}>
              Correlation: {(correlation * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <TabsList>
            <TabsTrigger value="15M">15M</TabsTrigger>
            <TabsTrigger value="1H">1H</TabsTrigger>
            <TabsTrigger value="4H">4H</TabsTrigger>
            <TabsTrigger value="12H">12H</TabsTrigger>
            <TabsTrigger value="24H">24H</TabsTrigger>
            <TabsTrigger value="1W">1W</TabsTrigger>
            <TabsTrigger value="1M">1M</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorDepositsPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="colorDepositsNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            yAxisId="deposits"
            orientation="left"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => formatCurrency(value, true)}
          />
          <YAxis 
            yAxisId="btc"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            domain={btcDomain}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            yAxisId="deposits"
            type="monotone"
            dataKey="cumulativeDeposits"
            stroke={isNetPositive ? "#22c55e" : "#ef4444"}
            strokeWidth={2}
            fill={isNetPositive ? "url(#colorDepositsPositive)" : "url(#colorDepositsNegative)"}
            dot={false}
            activeDot={{ r: 4, fill: isNetPositive ? "#22c55e" : "#ef4444", strokeWidth: 0 }}
          />
          <Line
            yAxisId="btc"
            type="monotone"
            dataKey="btcPrice"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
} 