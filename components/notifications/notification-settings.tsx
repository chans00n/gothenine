"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Bell, 
  Calendar, 
  Dumbbell, 
  Droplets, 
  BookOpen, 
  Camera, 
  Trophy, 
  Clock,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { getNotificationService, type NotificationPreferences } from '@/lib/services/notification-service'
import { NotificationPermission } from './notification-permission-simple'

interface NotificationSettingsProps {
  timezone: string
}

export function NotificationSettings({ timezone }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Initialize on client side only
    if (typeof window !== 'undefined') {
      const notificationService = getNotificationService()
      
      // Load saved preferences or use defaults
      const saved = localStorage.getItem('75hard-notification-preferences')
      if (saved) {
        setPreferences(JSON.parse(saved))
      } else {
        setPreferences(notificationService.getDefaultPreferences())
      }

      // Check permission status
      setHasPermission(notificationService.getPermissionStatus() === 'granted')
    }
  }, [])

  const handleSave = async () => {
    if (!preferences) return
    
    setIsSaving(true)

    try {
      // Save preferences
      localStorage.setItem('75hard-notification-preferences', JSON.stringify(preferences))

      // Schedule notifications if enabled
      const notificationService = getNotificationService()
      if (preferences.enabled && hasPermission) {
        await notificationService.scheduleNotifications(preferences, timezone)
      } else {
        await notificationService.cancelAllNotifications()
      }

      toast.success('Notification settings saved')
    } catch (error) {
      toast.error('Failed to save notification settings')
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => prev ? { ...prev, [key]: value } : null)
  }

  // Show loading state while preferences are being loaded
  if (!preferences) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading notification settings...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Permission Status</CardTitle>
          </div>
          <CardDescription>
            Notification permissions and master settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationPermission 
            showInline 
            onPermissionGranted={() => setHasPermission(true)}
            onPermissionDenied={() => setHasPermission(false)}
          />

          <Separator />

          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled" className="text-base">
                Enable Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Turn on/off all notifications
              </p>
            </div>
            <div className="flex items-center gap-2">
              {preferences.enabled && hasPermission && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
              <Switch
                id="notifications-enabled"
                checked={preferences.enabled}
                onCheckedChange={(checked) => updatePreference('enabled', checked)}
                disabled={!hasPermission}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {preferences.enabled && hasPermission && (
        <>
          {/* Daily & Task Reminders */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle>Daily Reminders</CardTitle>
              </div>
              <CardDescription>
                General daily check-ins and task reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Daily Reminder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label htmlFor="daily-reminder">Daily Check-in</Label>
                      <p className="text-sm text-muted-foreground">
                        Remind me to complete my daily tasks
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="daily-reminder"
                    checked={preferences.dailyReminder}
                    onCheckedChange={(checked) => updatePreference('dailyReminder', checked)}
                  />
                </div>
                {preferences.dailyReminder && (
                  <div className="ml-8 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={preferences.dailyReminderTime}
                      onChange={(e) => updatePreference('dailyReminderTime', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">daily reminder</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workout Reminders */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                <CardTitle>Workout Reminders</CardTitle>
              </div>
              <CardDescription>
                Set up reminders for your indoor and outdoor workouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="workout-reminders">Workout Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Remind me to complete both workouts
                    </p>
                  </div>
                </div>
                <Switch
                  id="workout-reminders"
                  checked={preferences.workoutReminders}
                  onCheckedChange={(checked) => updatePreference('workoutReminders', checked)}
                />
              </div>
              {preferences.workoutReminders && (
                <div className="ml-8 space-y-3 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Workout 1:</span>
                    <Input
                      type="time"
                      value={preferences.workoutReminderTimes[0]}
                      onChange={(e) => {
                        const times = [...preferences.workoutReminderTimes]
                        times[0] = e.target.value
                        updatePreference('workoutReminderTimes', times)
                      }}
                      className="w-32"
                    />
                    <span className="text-xs text-muted-foreground">indoor/outdoor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Workout 2:</span>
                    <Input
                      type="time"
                      value={preferences.workoutReminderTimes[1]}
                      onChange={(e) => {
                        const times = [...preferences.workoutReminderTimes]
                        times[1] = e.target.value
                        updatePreference('workoutReminderTimes', times)
                      }}
                      className="w-32"
                    />
                    <span className="text-xs text-muted-foreground">backup time</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lifestyle Reminders */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                <CardTitle>Lifestyle Reminders</CardTitle>
              </div>
              <CardDescription>
                Water intake, reading, and photo reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Water Reminders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Droplets className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label htmlFor="water-reminders">Water Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Remind me to drink water regularly
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="water-reminders"
                    checked={preferences.waterReminders}
                    onCheckedChange={(checked) => updatePreference('waterReminders', checked)}
                  />
                </div>
                {preferences.waterReminders && (
                  <div className="ml-8 flex items-center gap-2 p-3 rounded-lg bg-primary/5">
                    <span className="text-sm text-muted-foreground">Every</span>
                    <Input
                      type="number"
                      min="1"
                      max="6"
                      value={preferences.waterReminderInterval}
                      onChange={(e) => updatePreference('waterReminderInterval', parseInt(e.target.value))}
                      className="w-16"
                    />
                    <span className="text-sm text-muted-foreground">hours</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Reading Reminder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label htmlFor="reading-reminder">Reading Reminder</Label>
                      <p className="text-sm text-muted-foreground">
                        Remind me to read 10 pages
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="reading-reminder"
                    checked={preferences.readingReminder}
                    onCheckedChange={(checked) => updatePreference('readingReminder', checked)}
                  />
                </div>
                {preferences.readingReminder && (
                  <div className="ml-8 flex items-center gap-2 p-3 rounded-lg bg-primary/5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={preferences.readingReminderTime}
                      onChange={(e) => updatePreference('readingReminderTime', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">daily reading</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Photo Reminder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label htmlFor="photo-reminder">Photo Reminder</Label>
                      <p className="text-sm text-muted-foreground">
                        Remind me to take progress photo
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="photo-reminder"
                    checked={preferences.photoReminder}
                    onCheckedChange={(checked) => updatePreference('photoReminder', checked)}
                  />
                </div>
                {preferences.photoReminder && (
                  <div className="ml-8 flex items-center gap-2 p-3 rounded-lg bg-primary/5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={preferences.photoReminderTime}
                      onChange={(e) => updatePreference('photoReminderTime', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">progress photo</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Achievement & Progress Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                <CardTitle>Progress Alerts</CardTitle>
              </div>
              <CardDescription>
                Celebrate your achievements and milestones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Achievement Alerts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="achievement-alerts">Achievement Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify me when I unlock achievements
                    </p>
                  </div>
                </div>
                <Switch
                  id="achievement-alerts"
                  checked={preferences.achievementAlerts}
                  onCheckedChange={(checked) => updatePreference('achievementAlerts', checked)}
                />
              </div>

              <Separator />

              {/* Streak Alerts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="streak-alerts">Streak Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Celebrate streak milestones
                    </p>
                  </div>
                </div>
                <Switch
                  id="streak-alerts"
                  checked={preferences.streakAlerts}
                  onCheckedChange={(checked) => updatePreference('streakAlerts', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Save Settings */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || (!hasPermission && preferences.enabled)}
            className="w-full"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving Settings...' : 'Save Notification Settings'}
          </Button>
          
          {!hasPermission && preferences.enabled && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-sm text-primary">
                  Notifications are enabled but permission is not granted. Please enable notifications to receive reminders.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}