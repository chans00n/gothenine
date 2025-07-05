// Simple Web Push implementation for Deno/Supabase Edge Functions
import { encode } from 'https://deno.land/std@0.168.0/encoding/base64url.ts'

interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
  }>
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload,
  vapidKeys: { publicKey: string; privateKey: string; subject: string }
): Promise<Response> {
  const payloadString = JSON.stringify(payload)
  
  // For now, we'll use a simpler approach - call your Next.js API
  // This avoids the complexity of implementing the full Web Push Protocol in Deno
  const apiUrl = 'https://www.gothenine.com/api/notifications/send'
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('NOTIFICATION_API_KEY') || 'internal-key'}`
      },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        },
        notification: payload
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`)
    }
    
    return response
  } catch (error) {
    console.error('Error sending push notification:', error)
    throw error
  }
}