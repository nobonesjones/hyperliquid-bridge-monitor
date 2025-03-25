# Hyperliquid Monitoring Platform - Project Development Document

## Project Overview

This project is a web application that monitors large deposits to Hyperliquid cryptocurrency exchange and enables copy trading. The platform uses a starter kit with pre-built authentication, focusing development efforts on the dashboard and key monitoring features.

## Tech Stack

### Frontend
- **Next.js** (v14.2.13) - React framework
- **React** (v18) - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** (v3.4.1) - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI primitives
   - **Uses Radix UI components**
   - **Includes `class-variance-authority` for variants**
   - **Uses `clsx` and `tailwind-merge` for class utilities**

### Backend/Infrastructure
- **Supabase** - Backend-as-a-Service
   - **PostgreSQL database**
   - **Authentication (via @supabase/auth-helpers-nextjs)**
   - **Real-time subscriptions (@supabase/supabase-js)**

### External API Integration
- **Hyperliquid API** - For monitoring large deposits and facilitating copy trading

## Project Features

### 1. Authentication System (Pre-built)
- **Email/password authentication**
- **Social login options**
- **Password reset functionality**
- **User profile management**

### 2. Dashboard
- **Key Metrics Dashboard**
  - **24hr Deposit Volume (large deposits above threshold)**
  - **1hr Deposits (recent large deposits)**
  - **Deposit Trend (percentage change over time)**
  - **Net Buy/Sell (inflow vs outflow over 24hrs)**
  
- **Integrated Deposit & Trader Monitor**
  - **Comprehensive table showing large deposits with trader insights**
  - **Transaction hash (clickable to open on Hyperliquid explorer)**
  - **Wallet address and nickname**
  - **Deposit amount with visual indicators**
  - **In/Out directional indicator**
  - **7-day and 30-day PnL for the wallet**
  - **Number of open positions**
  - **"Follow" action button for copy trading setup**
  - **Configurable deposit threshold filter (100K, 500K, 1M)**

### 3. Copy Trading System
- **Copy Trading Overview**
  - **Performance metrics for all copy trades**
  - **Win rate, total PnL, average gain**
  
- **Wallets Management**
  - **List of wallets being followed**
  - **Individual wallet performance statistics**
  - **Collapsible details sections**
  - **Copy trade configuration options**
  - **Toggle to activate/deactivate copying**
  
- **Active Positions**
  - **List of currently copied positions**
  - **Position details (asset, position type, entry price)**
  - **Current price and PnL tracking**
  - **Option to manually close positions**
  
### 4. Market Context Dashboard
- **Market Indicators**
  - **Fear & Greed Index visualization**
  - **Super Trend indicators for major assets**
  - **Market overview charts**

## Dashboard Layout & Components

### Main Dashboard Layout
- **Navigation Header**
   - **Platform name/logo**
   - **Main navigation options**
   - **User menu and notifications**
   - **Theme-aware logo with teal accent**

- **Dashboard Title & Description**
   - **Clear dashboard title**
   - **Brief description of functionality**

- **Metrics Cards Row**
   - **Four equal-sized cards showing key metrics**
   - **Each with title, description, and prominent value display**
   - **Visual indicators for positive/negative trends**

- **Filter & Control Section**
   - **Deposit threshold filter dropdown**
   - **Last updated timestamp**
   - **Refresh button with loading state**

- **Integrated Deposit & Trader Table**
   - **Full-width table with the following columns:**
     - **Transaction hash (with external link)**
     - **Wallet address & nickname**
     - **Deposit amount**
     - **Direction (In/Out)**
     - **7-day PnL**
     - **30-day PnL**
     - **Open positions count**
     - **Follow action button**

- **Follow Dialog**
   - **Modal dialog for configuring copy trading**
   - **Displays wallet details**
   - **Input fields for nickname, copy amount, and leverage**
   - **Cancel and confirm buttons**

### Component Implementation Details

#### Metric Cards
```tsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium">{title}</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{value}</div>
    {showTrend && (
      <p className="text-xs text-muted-foreground">
        {isPositive ? <TrendingUp className="inline h-3 w-3 mr-1" /> : <TrendingDown className="inline h-3 w-3 mr-1" />}
        <span className={isPositive ? "text-green-500" : "text-red-500"}>
          {trend}
        </span>
      </p>
    )}
  </CardContent>
</Card>
```

#### Deposit Filter Dropdown
```tsx
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
```

#### Integrated Deposit & Trader Table
```tsx
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
          <a href={`https://hyperliquid.xyz/tx/${deposit.fullTransaction}`}
             target="_blank" rel="noopener noreferrer"
             className="flex items-center hover:underline">
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
          {/* Direction indicator */}
        </TableCell>
        
        <TableCell className={getPnlColorClass(deposit.pnl7d)}>
          {formatPercentage(deposit.pnl7d)}
        </TableCell>
        
        <TableCell className={getPnlColorClass(deposit.pnl30d)}>
          {formatPercentage(deposit.pnl30d)}
        </TableCell>
        
        <TableCell>{deposit.positions} open</TableCell>
        
        <TableCell>
          <Button variant="outline" size="sm" onClick={() => openFollowDialog(deposit)}>
            Follow
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Follow Dialog
```tsx
<Dialog open={followDialogOpen} onOpenChange={setFollowDialogOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Follow Trader</DialogTitle>
      <DialogDescription>
        Configure settings to copy trades from {selectedTrader?.nickname || "this wallet"}.
      </DialogDescription>
    </DialogHeader>
    
    <div className="grid gap-4 py-4">
      {/* Dialog content with form fields */}
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setFollowDialogOpen(false)}>
        Cancel
      </Button>
      <Button type="submit">Start Copy Trading</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Data Models

### 1. User
- `id`: UUID (from Supabase Auth)
- `email`: String
- `created_at`: Timestamp
- `notification_preferences`: JSON

### 2. Wallet
- `id`: UUID
- `user_id`: Foreign Key to User
- `address`: String
- `nickname`: String
- `active`: Boolean
- `strategy`: Enum
- `created_at`: Timestamp
- `copy_amount`: Decimal
- `leverage`: Decimal

### 3. Transaction
- `id`: UUID
- `tx_hash`: String
- `wallet_address`: String
- `amount`: Decimal
- `direction`: Enum ('in', 'out')
- `timestamp`: Timestamp
- `viewed`: Boolean

### 4. Performance
- `id`: UUID
- `wallet_address`: String
- `pnl_7d`: Decimal
- `pnl_30d`: Decimal
- `open_positions`: Integer
- `last_updated`: Timestamp

### 5. CopyTrade
- `id`: UUID
- `user_id`: Foreign Key to User
- `source_wallet`: String
- `position_details`: JSON
- `entry_price`: Decimal
- `current_price`: Decimal
- `status`: Enum
- `created_at`: Timestamp
- `closed_at`: Timestamp (nullable)
- `profit_loss`: Decimal (nullable)

## API Requirements

### Hyperliquid API Integration

#### 1. Deposit Monitoring
- WebSocket subscription to real-time block updates
- Transaction filtering for large deposits (configurable threshold)
- Transaction details retrieval for additional context

#### 2. Wallet Performance Tracking
- Fetch wallet balances and historical performance
- Monitor PnL changes over time
- Track open positions count and details

#### 3. Copy Trading Execution
- Read wallet positions and trades
- Execute matching trades with configured parameters
- Position management (monitoring, closing)

## Development Workflow

### Phase 1: Main Dashboard Implementation
1. **Create the dashboard layout with shadcn/ui components**
2. **Implement the key metrics cards with static data**
3. **Build the integrated deposit and trader table**
4. **Add threshold filter functionality**
5. **Implement the follow dialog**

### Phase 2: API Integration
1. **Connect to Hyperliquid API for real-time data**
2. **Replace static data with live data from API**
3. **Implement real-time updates and caching strategy**
4. **Add proper error handling and loading states**

### Phase 3: Copy Trading Implementation
1. **Build the copy trading dashboard**
2. **Create wallet management interface**
3. **Implement position tracking components**
4. **Connect to trading API endpoints**

### Phase 4: Testing and Polishing
1. **Test with real data and edge cases**
2. **Optimize performance for large data sets**
3. **Implement responsive design adjustments**
4. **Add final polish and animations**

## Implementation Notes

### shadcn/ui Component Usage
- **Use shadcn/ui components consistently throughout the UI**
- **Follow the shadcn/ui composable pattern (separate Card, CardHeader, etc.)**
- **Implement proper color coding using variant patterns**
- **Maintain responsive design with proper grid layouts**

### Navigation & Interactivity
- **Avoid using the Button component with asChild + Link for navigation**
- **Use direct onClick handlers with `navigate` or `window.location` instead**
- **Ensure all interactive elements have proper hover and loading states**
- **Implement proper form validation using react-hook-form and zod**

### Accessibility
- **Ensure appropriate contrast ratios for all text elements**
- **Add ARIA labels to interactive elements**
- **Implement keyboard navigation support**
- **Use proper semantic HTML structures**

### Performance Considerations
- **Implement virtualization for large tables**
- **Use pagination for API calls with large result sets**
- **Optimize real-time updates to minimize re-renders**
- **Add data caching where appropriate**