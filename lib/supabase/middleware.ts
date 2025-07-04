import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    // Check if environment variables exist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.next({
        request,
      })
    }

    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected routes - updated to include all authenticated routes
    const protectedPaths = [
      '/dashboard',
      '/checklist',
      '/calendar',
      '/progress',
      '/photos',
      '/notes',
      '/timer',
      '/walk',
      '/water',
      '/settings',
      '/achievements',
      '/notifications',
      '/guide',
      '/help'
    ]
    const isProtectedPath = protectedPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )

    if (!user && isProtectedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth pages
    if (user && request.nextUrl.pathname.startsWith('/auth/')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    // Return a basic response on error to prevent the app from crashing
    return NextResponse.next({
      request,
    })
  }
}