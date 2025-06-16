import './globals.css'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/components/theme-provider'
import RootLayoutNav from '@/components/layout/root-layout-nav'
import { Toaster } from "@/components/ui/toaster"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'HyperTrade - Trading Intelligence Platform',
  description: 'Get your edge in crypto trading with HyperTrade.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={cn(
          'antialiased min-h-screen bg-black font-sf-pro'
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RootLayoutNav />
          <main>{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}