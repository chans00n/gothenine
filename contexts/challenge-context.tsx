'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Challenge = Database['public']['Tables']['challenges']['Row']

interface ChallengeContextType {
  currentChallenge: Challenge | null
  loading: boolean
  error: Error | null
  refreshChallenge: () => Promise<void>
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined)

export function ChallengeProvider({ children }: { children: React.ReactNode }) {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  const fetchChallenge = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setCurrentChallenge(null)
        return
      }

      // Get active challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (challengeError && challengeError.code !== 'PGRST116') {
        throw challengeError
      }

      // If no active challenge, create one
      if (!challenge) {
        const { data: newChallenge, error: createError } = await supabase
          .from('challenges')
          .insert({
            user_id: user.id,
            name: '75 Hard Challenge',
            start_date: new Date().toISOString(),
            is_active: true
          })
          .select()
          .single()

        if (createError) throw createError
        setCurrentChallenge(newChallenge)
      } else {
        setCurrentChallenge(challenge)
      }
    } catch (err) {
      console.error('Error fetching challenge:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChallenge()

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchChallenge()
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <ChallengeContext.Provider 
      value={{ 
        currentChallenge, 
        loading, 
        error,
        refreshChallenge: fetchChallenge 
      }}
    >
      {children}
    </ChallengeContext.Provider>
  )
}

export function useChallenge() {
  const context = useContext(ChallengeContext)
  if (context === undefined) {
    throw new Error('useChallenge must be used within a ChallengeProvider')
  }
  return context
}