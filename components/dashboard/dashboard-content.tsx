'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu'
import { 
  Dialog, DialogTrigger, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowUpCircle, ArrowDownCircle, RefreshCw, 
  ChevronDown, ExternalLink 
} from 'lucide-react'

// Mock data for large deposits with trader info
const deposits = [
  {
    id: 1,
    transaction: "0x474c...cc09",
    fullTransaction: "0x474c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2ccc09",
    wallet: "0x11dc...a581",
    fullWallet: "0x11dc8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2ca581",
    nickname: "WhaleOne",
    amount: 634722,
    direction: "in",
    pnl7d: 12.5,
    pnl30d: 32.1,
    positions: 4,
    date: "Mar 4, 09:09 AM",
    status: "new"
  },
  {
    id: 2,
    transaction: "0x6197...1bb3",
    fullTransaction: "0x61978e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c1bb3",
    wallet: "0x06e5...1fee",
    fullWallet: "0x06e58e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c1fee",
    nickname: "BigTrader",
    amount: 478258,
    direction: "out",
    pnl7d: 8.7,
    pnl30d: -5.4,
    positions: 7,
    date: "Mar 2, 04:09 AM",
    status: "viewed"
  },
  {
    id: 3,
    transaction: "0x2968...7dce",
    fullTransaction: "0x29688e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c7dce",
    wallet: "0x7329...7842",
    fullWallet: "0x73298e2c8e2c8e2c8e2c8e2c8e2c8e2c8e2c7842",
    nickname: "Satoshi2",
    amount: 672350,
    direction: "in",
    pnl7d: -3.2,
    pnl30d: 17.8,
    positions: 2,
    date: "Mar 1, 01:09 AM",
    status: "new"
  }
]

export default function DashboardContent() {
  const [threshold, setThreshold] = useState(500000)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState("")
  const [followDialogOpen, setFollowDialogOpen] = useState(false)
  const [selectedTrader, setSelectedTrader] = useState<any>(null)

  // Set initial timestamp after mount
  React.useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    }))
  }, [])

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  // Format percentage with + or - sign
  const formatPercentage = (percent: number) => {
    return percent >= 0 ? `+${percent}%` : `${percent}%`
  }

  // Get class for PnL coloring
  const getPnlColorClass = (pnl: number) => {
    return pnl >= 0 ? "text-green-500" : "text-red-500"
  }

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false)
      setLastUpdated(new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      }))
    }, 1000)
  }

  // Open follow dialog
  const openFollowDialog = (trader: any) => {
    setSelectedTrader(trader)
    setFollowDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">24hr Deposit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4M</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">1hr Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$634K</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deposit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+12%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Buy/Sell</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+$1.2M</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Large Deposit Monitor</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter: ${threshold / 1000}K <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setThreshold(100000)}>$100K</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setThreshold(500000)}>$500K</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setThreshold(1000000)}>$1M</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Integrated Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>In/Out</TableHead>
                <TableHead>7d PnL</TableHead>
                <TableHead>30d PnL</TableHead>
                <TableHead>Positions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.filter(d => d.amount >= threshold).map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell className="font-mono">
                    <a 
                      href={`https://hyperliquid.xyz/tx/${deposit.fullTransaction}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:underline"
                    >
                      {deposit.transaction}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-mono">{deposit.wallet}</div>
                    <div className="text-sm text-muted-foreground">{deposit.nickname}</div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="px-2 py-1 font-semibold bg-red-100/10 text-red-500 border-red-200/20">
                      {formatCurrency(deposit.amount)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {deposit.direction === 'in' ? (
                      <Badge variant="outline" className="bg-green-100/10 text-green-500 border-green-200/20">
                        IN <ArrowUpCircle className="ml-1 h-3 w-3" />
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100/10 text-red-500 border-red-200/20">
                        OUT <ArrowDownCircle className="ml-1 h-3 w-3" />
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell className={getPnlColorClass(deposit.pnl7d)}>
                    {formatPercentage(deposit.pnl7d)}
                  </TableCell>
                  
                  <TableCell className={getPnlColorClass(deposit.pnl30d)}>
                    {formatPercentage(deposit.pnl30d)}
                  </TableCell>
                  
                  <TableCell>{deposit.positions} open</TableCell>
                  
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openFollowDialog(deposit)}
                    >
                      Follow
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Follow Dialog */}
      <Dialog open={followDialogOpen} onOpenChange={setFollowDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Follow Trader</DialogTitle>
            <DialogDescription>
              Configure settings to copy trades from {selectedTrader?.nickname || "this wallet"}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wallet" className="text-right">
                Wallet
              </Label>
              <div className="col-span-3 font-mono text-sm">
                {selectedTrader?.fullWallet}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nickname" className="text-right">
                Nickname
              </Label>
              <Input
                id="nickname"
                defaultValue={selectedTrader?.nickname}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Copy Amount
              </Label>
              <Input
                id="amount"
                placeholder="$1000"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leverage" className="text-right">
                Leverage
              </Label>
              <Input
                id="leverage"
                type="number"
                defaultValue="1"
                min="1"
                max="10"
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Start Copy Trading</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
