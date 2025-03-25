'use client'

import DashboardLayout from './layout/dashboard-layout'

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px] rounded-lg border border-dashed">
          <p className="text-xl text-muted-foreground">Coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
