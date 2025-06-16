'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface PerformanceDataPoint {
  timestamp: number
  value: number
  time: string
}

interface TraderPerformanceChartProps {
  data: PerformanceDataPoint[]
  timeframe: string
  currentValue: number
  isLoading?: boolean
}

export function TraderPerformanceChart({ 
  data, 
  timeframe, 
  currentValue,
  isLoading = false 
}: TraderPerformanceChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 bg-muted/20 rounded animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="h-4 w-32 bg-muted rounded mx-auto mb-2"></div>
          <div className="h-3 w-24 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 bg-muted/20 rounded flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No performance data available</p>
          <p className="text-xs text-muted-foreground">Historical data will appear here</p>
        </div>
      </div>
    )
  }

  // Calculate if the performance is positive or negative
  const startValue = data[0]?.value || 0 // PnL starts at 0
  const endValue = data[data.length - 1]?.value || currentValue
  const isPositive = endValue >= 0 // PnL is positive if above zero

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      const isPositive = value >= 0
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {timeframe} PnL: {formatCurrency(value)}
          </p>
        </div>
      )
    }
    return null
  }

  // Format X-axis labels based on timeframe
  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem)
    
    switch (timeframe) {
      case '24H':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      case '1W':
        return date.toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })
      case '1M':
        return date.toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric'
        })
      case 'All':
        return date.toLocaleDateString('en-US', { 
          month: 'short',
          year: '2-digit'
        })
      default:
        return tickItem
    }
  }

  return (
    <div className="h-64 w-full relative">
      {/* Dynamic header overlay */}
      <div className="absolute top-2 left-4 z-10 bg-background/80 backdrop-blur-sm rounded px-2 py-1 border border-border/50">
        <span className="text-sm font-medium text-muted-foreground">
          {timeframe} PnL
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="5%" 
                stopColor={isPositive ? "#10b981" : "#ef4444"} 
                stopOpacity={0.3}
              />
              <stop 
                offset="95%" 
                stopColor={isPositive ? "#10b981" : "#ef4444"} 
                stopOpacity={0.0}
              />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="opacity-30"
            horizontal={true}
            vertical={false}
          />
          
          <XAxis 
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={formatXAxisLabel}
          />
          
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => formatCurrency(value)}
            domain={['dataMin - 1000', 'dataMax + 1000']}
            axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeOpacity: 0.3 }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Reference line for break-even (zero PnL) */}
          <ReferenceLine 
            y={0} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="2 2"
            strokeOpacity={0.7}
          />
          
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? "#10b981" : "#ef4444"}
            strokeWidth={2}
            fill="url(#equityGradient)"
            dot={false}
            activeDot={{ 
              r: 4, 
              fill: isPositive ? "#10b981" : "#ef4444",
              stroke: "hsl(var(--background))",
              strokeWidth: 2
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
} 