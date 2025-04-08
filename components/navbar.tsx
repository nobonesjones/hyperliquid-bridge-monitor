'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/auth-helpers-nextjs'
import { ThemeSwitcher } from './theme-switcher'
import { Button } from './ui/button'

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">HyperTrade</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add search or other nav items here */}
          </div>
          <nav className="flex items-center space-x-2">
            <ThemeSwitcher />
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className={pathname === '/dashboard' ? 'bg-accent' : ''}>
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleSignOut}>
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/sign-in">
                  <Button variant="ghost" className={pathname === '/auth/sign-in' ? 'bg-accent' : ''}>
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button variant="default" className={pathname === '/auth/sign-up' ? 'bg-primary/90' : ''}>
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </nav>
  )
}