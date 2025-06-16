import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import TraderDetailContent from '@/components/dashboard/trader-detail-content'

interface TraderDetailPageProps {
  params: {
    address: string
  }
}

export default async function TraderDetailPage({ params }: TraderDetailPageProps) {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Validate the address format
  if (!params.address.match(/^0x[a-fA-F0-9]{40}$/)) {
    notFound()
  }

  // Check if this trader is in the user's top traders list
  const { data: trader } = await supabase
    .from('top_traders')
    .select('*')
    .eq('user_id', user.id)
    .eq('address', params.address.toLowerCase())
    .single()

  return (
    <DashboardLayout>
      <TraderDetailContent 
        address={params.address} 
        traderName={trader?.name}
        isInWatchlist={!!trader}
      />
    </DashboardLayout>
  )
} 