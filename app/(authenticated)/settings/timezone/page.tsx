import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock } from 'lucide-react'

// Common US timezones
const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Mountain Time - Arizona (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Puerto_Rico', label: 'Atlantic Time (AT)' },
]

async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('timezone')
    .eq('id', user.id)
    .single()
  
  // Create profile if it doesn't exist
  if (!profile) {
    await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        timezone: 'America/New_York',
        display_name: user.email?.split('@')[0]
      })
  }
  
  return profile || { timezone: 'America/New_York' }
}

async function updateTimezone(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const timezone = formData.get('timezone') as string
  
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      timezone
    })
  
  if (error) {
    console.error('Error updating timezone:', error)
  }
  
  revalidatePath('/settings/timezone')
  revalidatePath('/dashboard')
  revalidatePath('/checklist')
}

export default async function TimezonePage() {
  const profile = await getUserProfile()
  
  if (!profile) {
    redirect('/auth/login')
  }
  
  const currentTime = new Date().toLocaleString('en-US', { 
    timeZone: profile.timezone,
    dateStyle: 'full',
    timeStyle: 'long'
  })
  
  return (
    <div className="container px-4 py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Timezone Settings</h1>
        <p className="text-muted-foreground">
          Set your timezone to ensure daily tasks reset at midnight in your location
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Your Timezone
          </CardTitle>
          <CardDescription>
            Your current time: {currentTime}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateTimezone} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Select your timezone</Label>
              <Select name="timezone" defaultValue={profile.timezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Daily tasks will reset at midnight in your selected timezone
              </p>
            </div>
            
            <Button type="submit">
              Save Timezone
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-6 p-4 rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-2">Why is timezone important?</h3>
        <p className="text-sm text-muted-foreground">
          The 75 Hard challenge requires you to complete all tasks within a single day. 
          By setting your correct timezone, we ensure that your daily progress resets at 
          midnight in your location, giving you the full 24 hours to complete your tasks.
        </p>
      </div>
    </div>
  )
}