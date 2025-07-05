import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPushNotificationService } from '@/lib/services/push-notification-service'

// This endpoint can be called by Supabase Edge Functions if needed
export async function POST(request: Request) {
  try {
    // Verify the request is authorized
    const headersList = headers()
    const authHeader = headersList.get('authorization')
    
    // Check for API key or Supabase service role
    const apiKey = process.env.NOTIFICATION_API_KEY
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, notification } = await request.json()

    if (!userId || !notification) {
      return NextResponse.json({ error: 'Missing userId or notification' }, { status: 400 })
    }

    const pushService = getPushNotificationService()
    await pushService.sendToUser(userId, notification)

    return NextResponse.json({ 
      success: true,
      message: 'Notification sent successfully'
    })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}