import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Temporarily simplified middleware to debug the issue
  const pathname = request.nextUrl.pathname
  
  // Only protect authenticated routes
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
  
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  // For now, just pass through all requests
  // This will help us determine if the Supabase client is causing the issue
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api|public).*)',
  ],
}