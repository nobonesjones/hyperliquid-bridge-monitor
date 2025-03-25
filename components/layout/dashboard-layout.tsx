'use client'

import { ReactNode } from 'react'
import Sidebar from './sidebar'
import TopNav from './top-nav'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
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
