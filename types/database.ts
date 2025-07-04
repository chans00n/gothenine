export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          notification_preferences: {
            daily_reminder: boolean
            reminder_time: string
            motivational_messages: boolean
          }
          timezone: string
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          notification_preferences?: {
            daily_reminder: boolean
            reminder_time: string
            motivational_messages: boolean
          }
          timezone?: string
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          notification_preferences?: {
            daily_reminder: boolean
            reminder_time: string
            motivational_messages: boolean
          }
          timezone?: string
          created_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          rules: {
            workout_1: { duration: number; type: string }
            workout_2: { duration: number; type: string }
            diet: { type: string }
            water: { amount: number; unit: string }
            reading: { pages: number; type: string }
            progress_photo: { required: boolean }
          }
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          rules?: {
            workout_1: { duration: number; type: string }
            workout_2: { duration: number; type: string }
            diet: { type: string }
            water: { amount: number; unit: string }
            reading: { pages: number; type: string }
            progress_photo: { required: boolean }
          }
          start_date: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          rules?: {
            workout_1: { duration: number; type: string }
            workout_2: { duration: number; type: string }
            diet: { type: string }
            water: { amount: number; unit: string }
            reading: { pages: number; type: string }
            progress_photo: { required: boolean }
          }
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      daily_progress: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          date: string
          tasks: Record<string, {
            completed: boolean
            completedAt: string | null
            duration?: number
            notes?: string
            photoUrl?: string
          }>
          tasks_completed: number
          is_complete: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          date: string
          tasks?: Record<string, {
            completed: boolean
            completedAt: string | null
            duration?: number
            notes?: string
            photoUrl?: string
          }>
          tasks_completed?: number
          is_complete?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          date?: string
          tasks?: Record<string, {
            completed: boolean
            completedAt: string | null
            duration?: number
            notes?: string
            photoUrl?: string
          }>
          tasks_completed?: number
          is_complete?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      notification_logs: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string | null
          body: string | null
          scheduled_for: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title?: string | null
          body?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string | null
          body?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Helper types for easier use
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Challenge = Database['public']['Tables']['challenges']['Row']
export type DailyProgress = Database['public']['Tables']['daily_progress']['Row']
export type NotificationLog = Database['public']['Tables']['notification_logs']['Row']

export type TaskProgress = DailyProgress['tasks'][string]