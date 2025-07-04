"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Dumbbell, 
  Footprints, 
  BookOpen, 
  Camera, 
  Droplets,
  Brain,
  TrendingUp,
  Clock
} from "lucide-react"

interface QuickStat {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtext?: string
}

interface QuickStatsProps {
  stats?: QuickStat[]
  isLoading?: boolean
}

const defaultStats: QuickStat[] = [
  {
    label: "Workouts",
    value: "0",
    icon: <Dumbbell className="h-4 w-4" />,
    color: "text-blue-500",
    subtext: "completed"
  },
  {
    label: "Outdoor Walks",
    value: "0",
    icon: <Footprints className="h-4 w-4" />,
    color: "text-green-500",
    subtext: "45 min walks"
  },
  {
    label: "Books Read",
    value: "0",
    icon: <BookOpen className="h-4 w-4" />,
    color: "text-purple-500",
    subtext: "pages today"
  },
  {
    label: "Progress Photos",
    value: "0",
    icon: <Camera className="h-4 w-4" />,
    color: "text-orange-500",
    subtext: "taken"
  },
  {
    label: "Water Intake",
    value: "0",
    icon: <Droplets className="h-4 w-4" />,
    color: "text-cyan-500",
    subtext: "gallons today"
  },
  {
    label: "Meditation",
    value: "0",
    icon: <Brain className="h-4 w-4" />,
    color: "text-pink-500",
    subtext: "minutes"
  }
]

export function QuickStats({ stats = defaultStats, isLoading }: QuickStatsProps) {
  if (isLoading) {
    return <QuickStatsSkeleton />
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`${stat.color}`}>
                {stat.icon}
              </div>
              {index === 0 && (
                <TrendingUp className="h-3 w-3 text-green-500" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              {stat.subtext && (
                <p className="text-xs text-muted-foreground opacity-75">
                  {stat.subtext}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function QuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2 w-14" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface QuickStatsCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  isLoading?: boolean
}

export function QuickStatsCard({ 
  label, 
  value, 
  icon, 
  trend,
  isLoading 
}: QuickStatsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-10 w-20 mb-2" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-muted">
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              <TrendingUp className={`h-3 w-3 ${
                !trend.isPositive ? 'rotate-180' : ''
              }`} />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}