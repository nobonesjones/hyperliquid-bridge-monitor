import './globals.css'
import { Bricolage_Grotesque } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/components/theme-provider'
import RootLayoutNav from '@/components/layout/root-layout-nav'

export const dynamic = 'force-dynamic'

const fontHeading = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
})

const fontBody = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

export const metadata = {
  title: 'Supastar - Your SaaS Starter Kit',
  description: 'Get started with your SaaS project in minutes, not months.',
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
          'antialiased min-h-screen bg-background font-sans',
          fontHeading.variable,
          fontBody.variable
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
        </ThemeProvider>
      </body>
    </html>
  )
}