"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Pencil, ArrowLeft } from 'lucide-react'
import DashboardContent from '@/components/dashboard/dashboard-content'

export default function ProfilePage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)

  // Fetch user data on mount
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || "")
        setName(user.user_metadata?.display_name || "")
      }
      setLoading(false)
    }
    loadProfile()
  }, [supabase.auth])

  const handleUpdateName = async () => {
    try {
      // Update auth user metadata
      const { data: { user }, error: authError } = await supabase.auth.updateUser({
        data: { display_name: name }
      })

      if (authError) throw authError

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (profileError) throw profileError

      toast({
        title: "Profile Updated",
        description: "Your name has been successfully updated.",
      })
      setIsEditing(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-0">
        <DashboardContent />
      </div>
      <div className="relative z-10">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <Button 
                variant="ghost" 
                className="mb-6 hover:bg-background/50" 
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <Card className="bg-card/95 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Manage your account settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="max-w-sm"
                            placeholder="Enter your name"
                          />
                          <Button onClick={handleUpdateName} size="sm">Save</Button>
                          <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">Cancel</Button>
                        </>
                      ) : (
                        <>
                          <span>{name || "Not set"}</span>
                          <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="flex items-center space-x-2">
                      <span>{email}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSignOut} variant="destructive">
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
