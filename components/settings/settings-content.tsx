"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { User, Bell, Moon, Shield, Smartphone, ChevronRight, Camera, Upload, Settings, CheckCircle2, Calendar, Trophy, LogOut } from "lucide-react"
import Link from "next/link"
import { useTheme } from "@/components/theme-provider"
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface SettingsContentProps {
  initialData: {
    user: {
      id: string
      email: string
      displayName: string
      timezone: string
      avatarUrl?: string
    }
  }
}

export function SettingsContent({ initialData }: SettingsContentProps) {
  const [displayName, setDisplayName] = useState(initialData.user.displayName)
  const [avatarUrl, setAvatarUrl] = useState(initialData.user.avatarUrl || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [offlineMode, setOfflineMode] = useState(false)
  const { theme, setTheme } = useTheme()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // Load offline mode preference from localStorage
    const savedOfflineMode = localStorage.getItem('75hard-offline-mode')
    setOfflineMode(savedOfflineMode === 'true')
  }, [])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${initialData.user.id}_${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath)

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', initialData.user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast.success('Avatar updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString()
        })
        .eq('id', initialData.user.id)

      if (error) throw error

      toast.success('Profile updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOfflineModeToggle = (checked: boolean) => {
    setOfflineMode(checked)
    localStorage.setItem('75hard-offline-mode', checked.toString())
    
    if (checked) {
      toast.success('Offline mode enabled - Data will be cached locally')
    } else {
      toast.success('Offline mode disabled')
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      // TODO: Implement account deletion
      toast.error('Account deletion not yet implemented')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear any local storage data
      localStorage.removeItem('75hard-notification-dismissed')
      localStorage.removeItem('75hard-offline-mode')
      
      toast.success('Logged out successfully')
      router.push('/auth/login')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to log out')
    }
  }

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b">
        <div className="container px-4 py-6 md:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Avatar Section */}
              <div className="relative">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-lg">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 md:w-12 md:h-12 text-primary/50" />
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label htmlFor="avatar-upload" className="cursor-pointer" aria-label="Upload avatar image">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                        {uploadingAvatar ? (
                          <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5 text-gray-700" />
                        )}
                      </div>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                      aria-label="Upload avatar image file"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm font-medium">Settings</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {displayName || 'Your Profile'}
                </h1>
                <p className="text-muted-foreground">
                  {formattedDate} • Manage your account and app preferences
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-4 md:gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{theme === 'dark' ? 'Dark' : 'Light'}</p>
                  <p className="text-xs text-muted-foreground">Theme</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{initialData.user.timezone.split('/')[1]}</p>
                  <p className="text-xs text-muted-foreground">Timezone</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{offlineMode ? 'On' : 'Off'}</p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle>Profile Information</CardTitle>
                </div>
                <CardDescription>
                  Update your personal information and avatar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Your name" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={initialData.user.email} 
                    disabled
                    className="opacity-60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="timezone"
                      value={initialData.user.timezone} 
                      disabled
                      className="opacity-60 flex-1"
                      aria-label="Current timezone setting"
                    />
                    <Link href="/settings/timezone">
                      <Button variant="outline" size="sm">
                        Change
                      </Button>
                    </Link>
                  </div>
                </div>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || displayName === initialData.user.displayName}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Settings Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Notification Settings */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <CardTitle>Notifications</CardTitle>
                  </div>
                  <CardDescription>
                    Configure your reminder settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/settings/notifications">
                    <Button variant="outline" className="w-full justify-between">
                      <span>Manage Notifications</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/test-notifications">
                    <Button variant="outline" className="w-full justify-between">
                      <span>Test Notifications</span>
                      <Badge variant="secondary" className="ml-2">Dev</Badge>
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* App Preferences */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    <CardTitle>App Preferences</CardTitle>
                  </div>
                  <CardDescription>
                    Customize your app experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle dark theme
                      </p>
                    </div>
                    <Switch 
                      id="dark-mode"
                      checked={mounted ? theme === 'dark' : false}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                      disabled={!mounted}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="offline-mode">Offline Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable offline data caching
                      </p>
                    </div>
                    <Switch 
                      id="offline-mode"
                      checked={mounted ? offlineMode : false}
                      onCheckedChange={handleOfflineModeToggle}
                      disabled={!mounted}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <CardTitle>Privacy & Security</CardTitle>
                </div>
                <CardDescription>
                  Manage your data and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Download Your Data
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleDeleteAccount}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
                <Separator />
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Your data is securely stored and encrypted. You can download or delete your account data at any time.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}