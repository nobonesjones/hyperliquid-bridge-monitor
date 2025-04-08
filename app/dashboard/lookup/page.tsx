import DashboardLayout from '@/components/layout/dashboard-layout'
import { HyperliquidWalletLookup } from '@/components/hyperliquid-wallet-lookup'

export default function Tool2Page({
  searchParams
}: {
  searchParams: { address?: string }
}) {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Wallet Lookup</h2>
        </div>
        <div className="grid gap-4">
          <HyperliquidWalletLookup initialAddress={searchParams.address} />
        </div>
      </div>
    </DashboardLayout>
  )
}
