import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('Push subscription request received')
    
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User auth error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('User authenticated:', user.id)

    // Get the subscription from the request body
    const subscription = await request.json()
    console.log('Subscription data received:', {
      endpoint: subscription.endpoint?.substring(0, 50) + '...',
      hasP256dh: !!subscription.keys?.p256dh,
      hasAuth: !!subscription.keys?.auth
    })
    
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      console.error('Invalid subscription data:', subscription)
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || ''

    // Store the subscription in the database
    console.log('Saving subscription to database...')
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error saving subscription:', error)
      return NextResponse.json({ 
        error: 'Failed to save subscription',
        details: error.message 
      }, { status: 500 })
    }

    console.log('Subscription saved successfully:', data?.id)
    
    return NextResponse.json({ 
      success: true,
      message: 'Push notification subscription saved successfully',
      subscriptionId: data?.id
    })
  } catch (error) {
    console.error('Subscribe endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the endpoint from the request
    const { endpoint } = await request.json()
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 })
    }

    // Delete the subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    if (error) {
      console.error('Failed to delete subscription:', error)
      return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Push notification subscription removed successfully'
    })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}