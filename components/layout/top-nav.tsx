'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { User as SupabaseUser } from '@supabase/auth-helpers-nextjs'
import { ThemeSwitcher } from '../theme-switcher'
import { useTheme } from 'next-themes'

type Profile = {
  id: string
  full_name?: string
  avatar_url?: string
  subscription_status?: 'active' | 'expired'
  current_period_end?: string
}

export default function TopNav() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { theme } = useTheme()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profile)
      }
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <header className={`sticky top-0 z-50 w-full ${theme === 'light' ? 'bg-[#FFFFFF] text-black' : 'bg-[#000000] text-white'}`}>
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/assets/logo.svg"
              alt="HyperTrade Logo"
              width={32}
              height={32}
              className="mr-4"
            />
            <span className={`text-lg font-semibold font-sf-pro ${theme === 'light' ? 'text-black' : 'text-white'}`}>HyperTrade</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className={`relative ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-800'}`}
            >
              <Bell className={`h-5 w-5 ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                3
              </span>
            </Button>

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`relative h-8 w-8 rounded-full ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-800'}`}
                >
                  <Avatar className="h-8 w-8">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name || user?.email || 'User'} 
                        className="aspect-square h-full w-full"
                      />
                    ) : (
                      <AvatarFallback>
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                {profile?.subscription_status && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs font-medium leading-none">
                          {profile.subscription_status === 'active' ? 'Active Subscription' : 'Subscription Expired'}
                        </p>
                        {profile.current_period_end && (
                          <p className="text-xs leading-none text-muted-foreground">
                            Until {new Date(profile.current_period_end).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
