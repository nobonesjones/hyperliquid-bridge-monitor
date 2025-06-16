'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table'
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog'
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, Trash2, Edit, Loader2 
} from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

interface TopTrader {
  id: string
  address: string
  name?: string
  created_at: string
}

export default function SettingsContent() {
  const [topTraders, setTopTraders] = useState<TopTrader[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingTrader, setIsAddingTrader] = useState(false)
  const [newTraderAddress, setNewTraderAddress] = useState('')
  const [newTraderName, setNewTraderName] = useState('')
  const [editingTrader, setEditingTrader] = useState<TopTrader | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Fetch top traders
  const fetchTopTraders = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: traders, error } = await supabase
        .from('top_traders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching top traders:', error)
        toast({
          title: "Error",
          description: "Failed to fetch traders",
          variant: "destructive"
        })
        return
      }

      setTopTraders(traders || [])
    } catch (error) {
      console.error('Error fetching top traders:', error)
    }
  }, [supabase, toast])

  // Add new trader
  const addTrader = async () => {
    if (!newTraderAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wallet address",
        variant: "destructive"
      })
      return
    }

    // Basic validation for Ethereum address format
    if (!newTraderAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: "Error",
        description: "Please enter a valid wallet address",
        variant: "destructive"
      })
      return
    }

    setIsAddingTrader(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('top_traders')
        .insert([
          { 
            user_id: user.id, 
            address: newTraderAddress.trim().toLowerCase(),
            name: newTraderName.trim() || null
          }
        ])

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Already Added",
            description: "This trader is already in your list",
            variant: "destructive"
          })
        } else {
          console.error('Error adding trader:', error)
          toast({
            title: "Error",
            description: "Failed to add trader. Please try again.",
            variant: "destructive"
          })
        }
        return
      }

      toast({
        title: "Success",
        description: "Trader added successfully"
      })

      setNewTraderAddress('')
      setNewTraderName('')
      setAddDialogOpen(false)
      fetchTopTraders()

    } catch (err) {
      console.error('Error adding trader:', err)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsAddingTrader(false)
    }
  }

  // Edit trader
  const updateTrader = async () => {
    if (!editingTrader) return

    setIsAddingTrader(true)
    try {
      const { error } = await supabase
        .from('top_traders')
        .update({ 
          name: newTraderName.trim() || null 
        })
        .eq('id', editingTrader.id)

      if (error) {
        console.error('Error updating trader:', error)
        toast({
          title: "Error",
          description: "Failed to update trader. Please try again.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Success",
        description: "Trader updated successfully"
      })

      setEditingTrader(null)
      setNewTraderName('')
      setEditDialogOpen(false)
      fetchTopTraders()

    } catch (err) {
      console.error('Error updating trader:', err)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsAddingTrader(false)
    }
  }

  // Delete trader
  const deleteTrader = async (traderId: string) => {
    try {
      const { error } = await supabase
        .from('top_traders')
        .delete()
        .eq('id', traderId)

      if (error) {
        console.error('Error deleting trader:', error)
        toast({
          title: "Error",
          description: "Failed to delete trader. Please try again.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Success",
        description: "Trader deleted successfully"
      })

      fetchTopTraders()

    } catch (err) {
      console.error('Error deleting trader:', err)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    }
  }

  // Initialize
  useEffect(() => {
    fetchTopTraders().finally(() => setIsLoading(false))
  }, [fetchTopTraders])

  const getAvatarColor = (address: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
    ]
    const index = address.charCodeAt(0) % colors.length
    return colors[index]
  }

  const startEdit = (trader: TopTrader) => {
    setEditingTrader(trader)
    setNewTraderName(trader.name || '')
    setEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="traders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traders">Top Traders</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="traders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Traders Management</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add and manage traders to monitor their performance and positions
                  </p>
                </div>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Trader
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Trader</DialogTitle>
                      <DialogDescription>
                        Enter the wallet address of the trader you want to monitor
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="address">Wallet Address</Label>
                        <Input
                          id="address"
                          placeholder="0x..."
                          value={newTraderAddress}
                          onChange={(e) => setNewTraderAddress(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Display Name (Optional)</Label>
                        <Input
                          id="name"
                          placeholder="Trader name or nickname"
                          value={newTraderName}
                          onChange={(e) => setNewTraderName(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={addTrader}
                        disabled={isAddingTrader}
                      >
                        {isAddingTrader ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Trader'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading traders...
                </div>
              ) : topTraders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No traders added yet. Add your first trader to start monitoring their performance.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trader</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topTraders.map((trader) => (
                        <TableRow key={trader.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={getAvatarColor(trader.address)}>
                                  {trader.address.slice(2, 4).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {trader.name || 'Unnamed Trader'}
                                </div>
                                {trader.name && (
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {!trader.name && (
                              <>
                                {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                              </>
                            )}
                            {trader.name && trader.address}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(trader.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(trader)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Trader</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove this trader from your monitoring list? 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteTrader(trader.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure your general application preferences
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">General settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your notification preferences
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trader</DialogTitle>
            <DialogDescription>
              Update the display name for this trader
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Display Name</Label>
              <Input
                id="edit-name"
                placeholder="Trader name or nickname"
                value={newTraderName}
                onChange={(e) => setNewTraderName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={updateTrader}
              disabled={isAddingTrader}
            >
              {isAddingTrader ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 