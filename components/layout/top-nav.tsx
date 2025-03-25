'use client'

import { Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/auth-helpers-nextjs'
import { ThemeSwitcher } from '../theme-switcher'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import Image from 'next/image'

interface Profile {
  id: string
  full_name?: string
  avatar_url?: string
  subscription_status?: string
  current_period_end?: string
}

export default function TopNav() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const supabase = createClientComponentClient()

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
    setUser(null)
    setProfile(null)
  }

  const getInitials = (name?: string) => {
    if (!name) return user?.email?.[0].toUpperCase() || '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="sticky top-0 z-50 h-16 border-b border-border bg-background-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-background-secondary/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Image
            src="/assets/logo.svg"
            alt="HyperTrade Logo"
            width={32}
            height={32}
            className="mr-4"
          />
          <span className="text-lg font-semibold">HyperTrade</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="h-5 w-5" />
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
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
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
  )
}
