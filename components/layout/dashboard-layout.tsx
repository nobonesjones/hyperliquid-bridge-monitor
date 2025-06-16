'use client'

import { ReactNode } from 'react'
import { useTheme } from 'next-themes'
import Sidebar from './sidebar'
import TopNav from './top-nav'
import '@/app/dashboard/dashboard-theme.css'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme } = useTheme()
  
  return (
    <div className={`min-h-screen bg-background dashboard-theme ${theme === 'dark' ? 'dark' : ''}`}>
      <TopNav />
      <div className="flex h-[calc(100vh-56px)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
