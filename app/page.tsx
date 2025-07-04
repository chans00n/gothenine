"use client"

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, 
  Calendar, 
  Smartphone, 
  ChevronRight,
  Dumbbell,
  Apple,
  Droplets,
  BookOpen,
  Camera,
  Target
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is logged in and redirect
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [router, supabase.auth])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-bold tracking-tight"
          >
            Transform Your Life in{' '}
            <span className="text-primary">75 Days</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Track your 75 Hard Challenge progress with our PWA. 
            Build mental toughness, develop discipline, and become the best version of yourself.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex gap-4 flex-wrap justify-center"
          >
            <Link href="/auth/register">
              <Button size="lg" className="gap-2">
                Start Your Journey
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Succeed
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <CheckCircle2 className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Daily Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Track all 5 daily tasks with our intuitive checklist. 
                    Never miss a task with smart reminders.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <Calendar className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Visual Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    See your journey at a glance with our 75-day calendar. 
                    Track streaks and celebrate milestones.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <Smartphone className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Works Offline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Install as a PWA and track your progress anywhere. 
                    Syncs automatically when you&apos;re back online.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">The 75 Hard Rules</CardTitle>
              <CardDescription>
                Follow these 5 rules every day for 75 days straight
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Dumbbell className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Two 45-Minute Workouts</h4>
                    <p className="text-sm text-muted-foreground">
                      One must be outdoors, regardless of weather
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Apple className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Follow a Diet</h4>
                    <p className="text-sm text-muted-foreground">
                      No cheat meals or alcohol allowed
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Droplets className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Drink 1 Gallon of Water</h4>
                    <p className="text-sm text-muted-foreground">
                      128 ounces throughout the day
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Read 10 Pages</h4>
                    <p className="text-sm text-muted-foreground">
                      Non-fiction, self-development books only
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Camera className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Take a Progress Photo</h4>
                    <p className="text-sm text-muted-foreground">
                      Document your transformation daily
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Target className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">No Compromises</h4>
                    <p className="text-sm text-muted-foreground">
                      Miss a task? Start over from day 1
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Change Your Life?</h2>
          <p className="text-lg text-muted-foreground">
            Join thousands who have completed the 75 Hard Challenge and transformed their lives.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="gap-2">
              Start Day 1 Now
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}