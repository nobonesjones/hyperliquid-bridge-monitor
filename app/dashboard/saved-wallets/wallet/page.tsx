import DashboardLayout from '@/components/layout/dashboard-layout'
import { HyperliquidWalletLookup } from '@/components/hyperliquid-wallet-lookup'

export default function SavedWalletPage({
  searchParams
}: {
  searchParams: { address?: string }
}) {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Saved Wallet</h2>
        </div>
        <div className="grid gap-4">
          <HyperliquidWalletLookup initialAddress={searchParams.address} />
        </div>
      </div>
    </DashboardLayout>
  )
}
