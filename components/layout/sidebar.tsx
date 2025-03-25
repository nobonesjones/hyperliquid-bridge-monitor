'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Copy, PieChart, MessageCircle, Settings, HelpCircle, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const pathname = usePathname()

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
          {[1, 2, 3].map((i) => (
            <Link
              key={i}
              href={`/dashboard/tool-${i}`}
              className={cn(
                "sidebar-nav-item",
                pathname === `/dashboard/tool-${i}` && "active"
              )}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Other
            </Link>
          ))}
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
