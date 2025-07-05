import { createClient } from '@/lib/supabase/client'

export async function getUserTimezone(): Promise<string> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return 'America/New_York' // Default timezone
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('timezone')
      .eq('id', user.id)
      .single()
    
    return profile?.timezone || 'America/New_York'
  } catch (error) {
    console.error('Error fetching user timezone:', error)
    return 'America/New_York'
  }
}

export function getTodayInTimezone(timezone: string): Date {
  // Get the current date in the user's timezone
  const now = new Date()
  
  // Format the date in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  const parts = formatter.formatToParts(now)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  
  // Create a date object at midnight in the local timezone
  // Use Date constructor with separate values to avoid timezone parsing issues
  const today = new Date(Number(year!), Number(month!) - 1, Number(day!), 0, 0, 0, 0)
  
  return today
}

export function formatDateForDB(date: Date): string {
  // Always format as YYYY-MM-DD for database
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

export function getDateInUserTimezone(timezone: string): string {
  const today = getTodayInTimezone(timezone)
  return formatDateForDB(today)
}

// Check if a date is "today" in the user's timezone
export function isToday(date: Date | string, timezone: string): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date
  const today = getTodayInTimezone(timezone)
  
  return formatDateForDB(checkDate) === formatDateForDB(today)
}

// Get start and end of day in user's timezone
export function getDayBounds(date: Date, timezone: string): { start: Date, end: Date } {
  const dateStr = date.toLocaleDateString('en-US', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  const [month, day, year] = dateStr.split('/')
  const start = new Date(`${year}-${month}-${day}T00:00:00`)
  const end = new Date(`${year}-${month}-${day}T23:59:59.999`)
  
  return { start, end }
}