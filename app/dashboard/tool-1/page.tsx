import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { BlockchainMonitorTest } from '@/components/blockchain-monitor-test'
import PlaceholderPage from '@/components/placeholder-page'

export default async function Tool1Page() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 w-full max-w-[1600px]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <BlockchainMonitorTest />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
