'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { BarChart2, Copy, PieChart, MessageCircle, Settings, HelpCircle, LayoutGrid, ChevronDown, ChevronRight, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FollowedWallet {
  address: string
  name: string
}

export default function Sidebar() {
  const supabase = createClientComponentClient()
  const pathname = usePathname()
  const [walletsOpen, setWalletsOpen] = useState(
    pathname === '/dashboard/tool-3' || pathname?.startsWith('/dashboard/tool-3/')
  )
  const [followedWallets, setFollowedWallets] = useState<Array<{ address: string; name: string }>>([])

  // Fetch followed wallets from database
  const fetchFollowedWallets = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: wallets } = await supabase
      .from('followed_wallets')
      .select('address, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setFollowedWallets(wallets || [])
  }, [supabase])

  // Initial load
  useEffect(() => {
    fetchFollowedWallets()
  }, [fetchFollowedWallets])

  // Listen for wallet follow/unfollow events
  useEffect(() => {
    const handleWalletFollowed = () => {
      fetchFollowedWallets()
    }

    window.addEventListener('walletFollowed', handleWalletFollowed)
    return () => {
      window.removeEventListener('walletFollowed', handleWalletFollowed)
    }
  }, [fetchFollowedWallets])

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('followed_wallets_changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'followed_wallets'
        }, 
        () => {
          fetchFollowedWallets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchFollowedWallets])

  return (
    <div className="w-64 border-r border-border bg-background-secondary">
      {/* Navigation */}
      <div className="flex flex-col gap-6 p-4">
        {/* Overview Section */}
        <nav className="flex flex-col gap-1">
          <div className="mb-2 px-2 text-xs font-medium text-foreground-muted">OVERVIEW</div>
          <Link
            href="/dashboard"
            className={cn(
              "sidebar-nav-item",
              pathname === '/dashboard' && "active"
            )}
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/copy-trading"
            className={cn(
              "sidebar-nav-item",
              pathname === '/dashboard/copy-trading' && "active"
            )}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Trading
          </Link>
          <Link
            href="/dashboard/market"
            className={cn(
              "sidebar-nav-item",
              pathname === '/dashboard/market' && "active"
            )}
          >
            <PieChart className="mr-2 h-4 w-4" />
            Market Context
          </Link>
        </nav>

        {/* Tools Section */}
        <nav className="flex flex-col gap-1">
          <div className="mb-2 px-2 text-xs font-medium text-foreground-muted">TOOLS</div>
          <Link
            href="/dashboard/tool-1"
            className={cn(
              "sidebar-nav-item",
              pathname === '/dashboard/tool-1' && "active"
            )}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Monitor
          </Link>
          <Link
            href="/dashboard/tool-2"
            className={cn(
              "sidebar-nav-item",
              pathname === '/dashboard/tool-2' && "active"
            )}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Look Up
          </Link>
          
          {/* Wallets with dropdown */}
          <div className="flex flex-col">
            <div 
              className={cn(
                "sidebar-nav-item cursor-pointer",
                pathname === `/dashboard/tool-3` && !pathname?.includes('/wallet') && "active"
              )}
              onClick={() => setWalletsOpen(!walletsOpen)}
            >
              <Wallet className="mr-2 h-4 w-4" />
              <span className="flex-1">Wallets</span>
              {walletsOpen ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </div>
            
            {walletsOpen && (
              <div className="ml-6 flex flex-col gap-1 mt-1">
                {/* Followed wallets */}
                {followedWallets.map((wallet) => (
                  <Link
                    key={wallet.address}
                    href={`/dashboard/tool-3/wallet/${wallet.address}`}
                    className={cn(
                      "sidebar-nav-item py-1.5 text-sm truncate",
                      pathname === `/dashboard/tool-3/wallet/${wallet.address}` && "active"
                    )}
                    title={wallet.address}
                  >
                    {wallet.name || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Communication Section */}
        <nav className="flex flex-col gap-1">
          <div className="mb-2 px-2 text-xs font-medium text-foreground-muted">COMMUNICATION</div>
          <Link
            href="/dashboard/chat"
            className={cn(
              "sidebar-nav-item",
              pathname === '/dashboard/chat' && "active"
            )}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat
          </Link>
        </nav>

        {/* Bottom Links */}
        <div className="mt-auto flex flex-col gap-1">
          <Link
            href="/dashboard/settings"
            className={cn(
              "sidebar-nav-item",
              pathname === '/dashboard/settings' && "active"
            )}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
          <Link
            href="/dashboard/help"
            className={cn(
              "sidebar-nav-item",
              pathname === '/dashboard/help' && "active"
            )}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Help
          </Link>
        </div>
      </div>
    </div>
  )
}
