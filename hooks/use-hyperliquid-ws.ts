'use client'

import { useState, useEffect } from 'react'

interface Trade {
  coin: string
  side: 'B' | 'S'
  sz: string
  px: string
  time: number
  oid: string
  uid: string
}

export function useHyperliquidWs() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)

  useEffect(() => {
    const ws = new WebSocket('wss://api.hyperliquid.xyz/ws')

    ws.onopen = () => {
      console.log('Connected to Hyperliquid WebSocket')
      setIsConnected(true)
      
      // Subscribe to BTC trades
      const subscribeMsg = {
        method: 'subscribe',
        subscription: {
          type: 'trades',
          coin: 'BTC'
        }
      }
      ws.send(JSON.stringify(subscribeMsg))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        
        // Handle trade updates
        if (data.channel === 'trades' && data.data) {
          setTrades(prev => {
            const newTrades = [...prev, data.data]
            // Keep only last 100 trades
            return newTrades.slice(-100)
          })
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    ws.onclose = () => {
      console.log('WebSocket connection closed')
      setIsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [])

  return {
    isConnected,
    trades,
    lastMessage
  }
}
