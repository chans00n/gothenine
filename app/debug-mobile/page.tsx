"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useErrorReporting } from '@/components/error-boundary'

export default function DebugMobilePage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [authStatus, setAuthStatus] = useState<string>('Checking...')
  const [errors, setErrors] = useState<any[]>([])
  const supabase = createClient()
  const { getStoredErrors, clearStoredErrors } = useErrorReporting()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          setAuthStatus(`Error: ${error.message}`)
        } else if (session) {
          setAuthStatus(`Authenticated: ${session.user.email}`)
        } else {
          setAuthStatus('Not authenticated')
        }
      } catch (err) {
        setAuthStatus(`Exception: ${err}`)
      }
    }

    const collectDebugInfo = () => {
      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        cookies: navigator.cookieEnabled,
        online: navigator.onLine,
        language: navigator.language,
        pathname: window.location.pathname,
        href: window.location.href,
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        standalone: (window.navigator as any).standalone || false,
      }
      setDebugInfo(info)
    }

    checkAuth()
    collectDebugInfo()
    
    // Get stored errors
    const storedErrors = getStoredErrors()
    setErrors(storedErrors)
  }, [supabase.auth, getStoredErrors])

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mobile Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Auth Status:</h3>
            <p className="text-sm font-mono bg-muted p-2 rounded">{authStatus}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Device Info:</h3>
            <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          {errors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Stored Errors ({errors.length}):</h3>
              <div className="space-y-2">
                {errors.map((error, idx) => (
                  <details key={idx} className="bg-muted p-2 rounded">
                    <summary className="cursor-pointer text-sm">
                      {error.message || 'Unknown error'} - {new Date(error.timestamp).toLocaleString()}
                    </summary>
                    <pre className="text-xs font-mono mt-2 overflow-auto">
                      {JSON.stringify(error, null, 2)}
                    </pre>
                  </details>
                ))}
              </div>
              <Button 
                onClick={() => {
                  clearStoredErrors()
                  setErrors([])
                }} 
                variant="destructive" 
                size="sm"
                className="mt-2"
              >
                Clear Errors
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}