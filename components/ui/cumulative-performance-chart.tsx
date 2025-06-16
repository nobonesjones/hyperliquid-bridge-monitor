import React from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface CumulativePerformanceChartProps {
  data: Array<{
    timestamp: number
    value: number
    date: string
  }>
  timeframe: string
  currentValue: number
  isLoading?: boolean
}

export function CumulativePerformanceChart({ 
  data, 
  timeframe, 
  currentValue, 
  isLoading = false 
}: CumulativePerformanceChartProps) {
  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No data available for selected timeframe
      </div>
    )
  }

  const isPositive = currentValue >= 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`text-sm font-semibold ${value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {timeframe} Cumulative PnL: {formatCurrency(value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="relative">
      {/* Floating header overlay */}
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border">
        <div className="text-sm font-medium text-muted-foreground">
          {timeframe} Cumulative PnL
        </div>
        <div className={`text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {formatCurrency(currentValue)}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="5%" 
                stopColor={isPositive ? "#22c55e" : "#ef4444"} 
                stopOpacity={0.3}
              />
              <stop 
                offset="95%" 
                stopColor={isPositive ? "#22c55e" : "#ef4444"} 
                stopOpacity={0.05}
              />
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
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => formatCurrency(value, true)}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={0} 
            stroke="#666" 
            strokeDasharray="2 2" 
            strokeOpacity={0.5}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? "#22c55e" : "#ef4444"}
            strokeWidth={2}
            fill="url(#colorPnl)"
            dot={false}
            activeDot={{ 
              r: 4, 
              fill: isPositive ? "#22c55e" : "#ef4444",
              strokeWidth: 0
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
} 