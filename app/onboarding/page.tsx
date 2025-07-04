"use client"

import { useRouter } from 'next/navigation'
import { OnboardingFlow, type OnboardingData } from '@/components/onboarding/onboarding-flow'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { getNotificationService } from '@/lib/services/notification-service'
import { createWelcomeNotification } from '@/lib/utils/notification-triggers'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleComplete = async (data: OnboardingData) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error('Please log in to continue')
        router.push('/auth/login')
        return
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          display_name: data.displayName,
          timezone: data.timezone,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Profile update error:', profileError)
        throw new Error(`Failed to update profile: ${profileError.message}`)
      }

      // Create active challenge
      const { error: challengeError } = await supabase
        .from('challenges')
        .insert({
          user_id: user.id,
          name: '75 Hard Challenge',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_active: true
        })

      if (challengeError) {
        console.error('Challenge creation error:', challengeError)
        // Check if it's a unique constraint error (user already has an active challenge)
        if (challengeError.code === '23505' || challengeError.message?.includes('duplicate')) {
          // Try to get existing challenge
          const { data: existingChallenge } = await supabase
            .from('challenges')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()
          
          if (existingChallenge) {
            console.log('User already has an active challenge')
          } else {
            throw new Error(`Failed to create challenge: ${challengeError.message}`)
          }
        } else {
          throw new Error(`Failed to create challenge: ${challengeError.message}`)
        }
      }

      // Set up notifications if enabled
      if (data.notificationsEnabled) {
        const notificationService = getNotificationService()
        if (notificationService.getPermissionStatus() === 'granted') {
          const preferences = notificationService.getDefaultPreferences()
        preferences.enabled = true
        preferences.dailyReminderTime = data.notificationPreferences.dailyReminderTime
        preferences.workoutReminderTimes = data.notificationPreferences.workoutReminderTimes
        preferences.waterReminderInterval = data.notificationPreferences.waterReminderInterval
        preferences.readingReminderTime = data.notificationPreferences.readingReminderTime
        preferences.photoReminderTime = data.notificationPreferences.photoReminderTime

          localStorage.setItem('75hard-notification-preferences', JSON.stringify(preferences))
          await notificationService.scheduleNotifications(preferences, data.timezone)
        }
      }

      // Create welcome notification
      await createWelcomeNotification()

      toast.success('Welcome to 75 Hard! Your journey begins now.')
      router.push('/dashboard')
    } catch (error) {
      console.error('Onboarding error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete setup'
      toast.error(errorMessage)
      
      // If it's a specific database error, provide more helpful message
      if (error instanceof Error) {
        if (error.message.includes('user_profiles')) {
          toast.error('Please make sure you are logged in')
        } else if (error.message.includes('challenges')) {
          toast.error('You may already have an active challenge')
        }
      }
    }
  }

  return <OnboardingFlow onComplete={handleComplete} />
}