import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import TopTradersContent from '@/components/dashboard/top-traders-content'

export default async function TopTradersPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Top Traders</h1>
            <p className="text-muted-foreground">
              Monitor performance and positions of top traders on Hyperliquid
            </p>
          </div>
        </div>
        <TopTradersContent />
      </div>
    </DashboardLayout>
  )
} 