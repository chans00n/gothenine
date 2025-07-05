"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { DotsSpinner } from '@/components/ui/loading-spinner'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    // Check if user is logged in and redirect
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          router.push('/dashboard')
        } else {
          setIsCheckingAuth(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsCheckingAuth(false)
      }
    }
    checkUser()
  }, [router, supabase.auth])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="mb-8">
          <Logo width={200} height={64} />
        </div>
        <DotsSpinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">
          Checking authentication...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex justify-center mb-6">
            <Logo width={200} height={64} />
          </div>
          <p className="text-xl text-muted-foreground">
            Transform Your Life in{' '}
            <span className="text-primary font-semibold">75 Days</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <Link href="/auth/register" className="block">
            <Button size="lg" className="w-full gap-2">
              Create Account
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          
          <Link href="/auth/login" className="block">
            <Button size="lg" variant="outline" className="w-full">
              Sign In
            </Button>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          Track your daily progress • Build mental toughness • No compromises
        </motion.p>
      </div>
    </div>
  )
}