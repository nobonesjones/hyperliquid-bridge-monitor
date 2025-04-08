import { NextResponse } from 'next/server'

const FIVE_MINUTES = 5 * 60 * 1000 // 5 minutes in milliseconds

interface Trade {
  time: string
  coin: string
  side: string
  sz: string
  px: string
  closedPnl: string
}

interface GroupedTrade {
  startTime: number
  endTime: number
  coin: string
  side: string
  totalSize: number
  avgPrice: number
  totalPnl: number
  tradeCount: number
}

function groupSimilarTrades(trades: Trade[]): GroupedTrade[] {
  const groups: GroupedTrade[] = []
  let currentGroup: GroupedTrade | null = null

  // Sort trades by time ascending
  const sortedTrades = [...trades].sort((a, b) => Number(a.time) - Number(b.time))

  sortedTrades.forEach((trade) => {
    const tradeTime = Number(trade.time)
    const tradePnl = Number(trade.closedPnl || 0)
    const tradeSize = Number(trade.sz || 0)
    const tradePrice = Number(trade.px || 0)

    // Check if we should start a new group
    const shouldStartNewGroup = !currentGroup || 
      tradeTime - currentGroup.startTime > FIVE_MINUTES ||
      trade.coin !== currentGroup.coin ||
      trade.side !== currentGroup.side

    if (shouldStartNewGroup) {
      // Add current group to groups array if it exists
      if (currentGroup) {
        groups.push(currentGroup)
      }

      // Create new group
      currentGroup = {
        startTime: tradeTime,
        endTime: tradeTime,
        coin: trade.coin,
        side: trade.side,
        totalSize: tradeSize,
        avgPrice: tradePrice,
        totalPnl: tradePnl,
        tradeCount: 1
      }
    } else if (currentGroup) { // Ensure currentGroup exists before updating
      // Update existing group
      currentGroup.endTime = tradeTime
      currentGroup.totalSize += tradeSize
      currentGroup.totalPnl += tradePnl
      currentGroup.avgPrice = ((currentGroup.avgPrice * currentGroup.tradeCount) + tradePrice) / (currentGroup.tradeCount + 1)
      currentGroup.tradeCount++
    }
  })

  // Don't forget to add the last group
  if (currentGroup) {
    groups.push(currentGroup)
  }

  return groups.sort((a, b) => b.startTime - a.startTime) // Sort by newest first
}

export async function POST(req: Request) {
  try {
    const { address } = await req.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    console.log('Fetching fills for address:', address)

    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: "userFills",
        user: address,
        startTime: 0,
        limit: 500 // Increased limit since we'll be grouping them
      })
    })

    console.log('Response status:', response.status)
    const rawText = await response.text()
    console.log('Raw response:', rawText)

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch from Hyperliquid API',
          status: response.status,
          details: rawText
        },
        { status: response.status }
      )
    }

    try {
      const fills = JSON.parse(rawText)
      const groupedTrades = groupSimilarTrades(fills)
      
      // Calculate total PnL and group by time periods
      const now = Date.now()
      const oneDayAgo = now - (24 * 60 * 60 * 1000)
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)

      const summary = {
        totalPnl: 0,
        last24h: 0,
        last7d: 0,
        last30d: 0,
        groupedTrades: groupedTrades
      }

      fills.forEach((fill: Trade) => {
        const pnl = Number(fill.closedPnl || 0)
        const timestamp = Number(fill.time || 0)
        
        summary.totalPnl += pnl
        
        if (timestamp >= oneDayAgo) summary.last24h += pnl
        if (timestamp >= sevenDaysAgo) summary.last7d += pnl
        if (timestamp >= thirtyDaysAgo) summary.last30d += pnl
      })

      return NextResponse.json(summary)
    } catch (parseError: unknown) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from Hyperliquid API',
          raw: rawText,
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
