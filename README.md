# Hyperliquid Bridge Monitor

A real-time monitoring dashboard for tracking large deposits and withdrawals on the Hyperliquid exchange via the Arbitrum bridge.

## Features

- Track USDC deposits and withdrawals ≥ $50,000
- Real-time updates every 30 seconds
- Transaction details with Arbiscan links
- Modern, responsive UI with dark mode support
- Coming soon: PnL tracking and position monitoring

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Blockchain**: Web3.js, Arbiscan API
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with custom theme system

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_ARBISCAN_API_KEY=your-arbiscan-api-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/app` - Next.js app router pages and layouts
- `/components` - React components
- `/lib/services` - Blockchain monitoring services
- `/hooks` - Custom React hooks
- `/public` - Static assets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
