import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { functionName } = await request.json()

    if (!functionName) {
      return NextResponse.json({ error: 'Function name required' }, { status: 400 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    const response = await fetch(
      `https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    )

    const data = await response.json()
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data
    })
  } catch (error) {
    console.error('Error testing edge function:', error)
    return NextResponse.json({ 
      error: 'Failed to test edge function',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}