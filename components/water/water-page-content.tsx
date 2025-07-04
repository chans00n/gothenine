'use client'

import { useState, useEffect } from 'react'
import { WaterIntakeCounter } from '@/components/water/water-intake-counter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { waterIntakeService } from '@/lib/services/water-intake'
import { Droplets, TrendingUp, Calendar, Award, Target, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface WaterPageContentProps {
  challengeId: string
}

interface DailyIntake {
  date: string
  amount: number
  goal: number
  percentage: number
}

export function WaterPageContent({ challengeId }: WaterPageContentProps) {
  const [weekHistory, setWeekHistory] = useState<DailyIntake[]>([])
  const [todayIntake, setTodayIntake] = useState<DailyIntake | null>(null)
  const [stats, setStats] = useState({
    averageIntake: 0,
    daysMetGoal: 0,
    currentStreak: 0,
    bestStreak: 0
  })

  useEffect(() => {
    fetchWaterHistory()
  }, [challengeId])

  const fetchWaterHistory = async () => {
    const history = await waterIntakeService.getIntakeHistory(challengeId, 7)
    
    const formattedHistory = history.map(day => ({
      date: day.date,
      amount: day.amount,
      goal: day.goal,
      percentage: Math.min(100, (day.amount / day.goal) * 100)
    }))
    
    setWeekHistory(formattedHistory)
    
    // Set today's intake
    const today = new Date().toISOString().split('T')[0]
    const todayData = formattedHistory.find(day => day.date === today)
    setTodayIntake(todayData || null)
    
    // Calculate stats
    const totalIntake = history.reduce((sum, day) => sum + day.amount, 0)
    const averageIntake = history.length > 0 ? totalIntake / history.length : 0
    const daysMetGoal = history.filter(day => day.amount >= day.goal).length
    
    // Calculate streaks
    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0
    
    // Sort by date ascending for streak calculation
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    sortedHistory.forEach((day, index) => {
      if (day.amount >= day.goal) {
        tempStreak++
        if (index === sortedHistory.length - 1) {
          currentStreak = tempStreak
        }
      } else {
        bestStreak = Math.max(bestStreak, tempStreak)
        tempStreak = 0
      }
    })
    
    bestStreak = Math.max(bestStreak, tempStreak)
    
    setStats({
      averageIntake,
      daysMetGoal,
      currentStreak,
      bestStreak
    })
  }

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    if (date.getTime() === today.getTime()) return 'Today'
    if (date.getTime() === today.getTime() - 86400000) return 'Yesterday'
    
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  const hasMetGoal = todayIntake && todayIntake.amount >= todayIntake.goal
  const goalPercentage = todayIntake ? Math.min(100, (todayIntake.amount / todayIntake.goal) * 100) : 0

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="container px-4 py-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary">
                    <Droplets className="h-4 w-4" />
                    <span className="text-sm font-medium">Water Goal</span>
                  </div>
                  {hasMetGoal && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Goal Complete
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">Water Intake</h1>
                <p className="text-muted-foreground">
                  {formattedDate} • Track your daily water intake
                </p>
              </div>
              
              <div className="flex gap-4 md:gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{todayIntake?.amount || 0} oz</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{Math.round(goalPercentage)}%</p>
                  <p className="text-xs text-muted-foreground">Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Water Intake Counter Section */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Droplets className="h-5 w-5" />
                        Water Intake Tracker
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formattedDate} • Goal: 128 oz (1 gallon)
                      </CardDescription>
                    </div>
                    {hasMetGoal && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Goal Complete
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <WaterIntakeCounter challengeId={challengeId} />
                  
                  {!hasMetGoal && (
                    <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Stay hydrated!</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Keep tracking your water intake to reach your daily goal of 128 oz.
                            {todayIntake && (
                              <span className="block mt-1">
                                You need {Math.max(0, todayIntake.goal - todayIntake.amount)} oz more to complete your goal.
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stats and History Sidebar */}
            <div className="space-y-6">
              
              {/* Today's Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Progress</CardTitle>
                  <CardDescription>
                    Your water intake for today
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Current</span>
                    </div>
                    <span className="text-lg font-bold">{todayIntake?.amount || 0} oz</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Goal</span>
                    </div>
                    <span className="text-lg font-bold">{todayIntake?.goal || 128} oz</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm font-medium">{Math.round(goalPercentage)}%</span>
                    </div>
                    <Progress value={goalPercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Overview</CardTitle>
                  <CardDescription>
                    Your hydration statistics this week
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Daily Average</span>
                    </div>
                    <span className="text-lg font-bold">{Math.round(stats.averageIntake)} oz</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Goals Met</span>
                    </div>
                    <span className="text-lg font-bold">{stats.daysMetGoal}/7</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Current Streak</span>
                    </div>
                    <span className="text-lg font-bold">{stats.currentStreak} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Best Streak</span>
                    </div>
                    <span className="text-lg font-bold">{stats.bestStreak} days</span>
                  </div>
                </CardContent>
              </Card>

              {/* 7-Day History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>7-Day History</span>
                    <Badge variant="secondary" className="text-xs">
                      {weekHistory.length} day{weekHistory.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Your water intake over the past week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weekHistory.map((day, index) => (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="space-y-2"
                      >
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{getDayName(day.date)}</span>
                          <span className="text-muted-foreground">
                            {day.amount} / {day.goal} oz
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={day.percentage} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {Math.round(day.percentage)}%
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Hydration Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Hydration Tips</CardTitle>
                  <CardDescription>
                    Stay consistent with your water intake
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">1 Gallon Daily</p>
                      <p className="text-xs text-muted-foreground">Drink 128 oz of water every day</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Spread Throughout Day</p>
                      <p className="text-xs text-muted-foreground">Don't drink it all at once</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Track Regularly</p>
                      <p className="text-xs text-muted-foreground">Log your intake throughout the day</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Stay Consistent</p>
                      <p className="text-xs text-muted-foreground">Build the habit for 75 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}