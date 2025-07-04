import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Ensure cookies work properly on iOS Safari
        getAll() {
          // Parse cookies manually for better mobile compatibility
          if (typeof document === 'undefined') return []
          
          return document.cookie.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=')
            return { name, value: decodeURIComponent(value || '') }
          }).filter(cookie => cookie.name)
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieStr = `${name}=${encodeURIComponent(value)}`
              const optionsStr = options ? Object.entries(options)
                .map(([key, val]) => {
                  if (key === 'maxAge') return `max-age=${val}`
                  if (key === 'httpOnly' || key === 'secure' || key === 'sameSite') {
                    return val ? key : ''
                  }
                  return `${key}=${val}`
                })
                .filter(Boolean)
                .join('; ') : ''
              
              document.cookie = `${cookieStr}${optionsStr ? `; ${optionsStr}` : ''}`
            })
          } catch (error) {
            console.error('Error setting cookies:', error)
          }
        },
      },
    }
  )
}