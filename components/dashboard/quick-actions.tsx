"use client"

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Droplets, 
  Footprints, 
  Timer, 
  Camera, 
  ArrowRight,
  Zap
} from 'lucide-react'
import Link from 'next/link'

const quickActions = [
  {
    id: 'water',
    title: 'Water Tracker',
    description: 'Track your daily water intake',
    icon: Droplets,
    href: '/water',
    color: 'bg-cyan-500/10 text-cyan-500',
    hoverColor: 'hover:bg-cyan-500/20'
  },
  {
    id: 'walk',
    title: 'Walk Tracker',
    description: 'Start an outdoor walk',
    icon: Footprints,
    href: '/walk',
    color: 'bg-green-500/10 text-green-500',
    hoverColor: 'hover:bg-green-500/20'
  },
  {
    id: 'timer',
    title: 'Workout Timer',
    description: '45-minute workout timer',
    icon: Timer,
    href: '/timer',
    color: 'bg-blue-500/10 text-blue-500',
    hoverColor: 'hover:bg-blue-500/20'
  },
  {
    id: 'photos',
    title: 'Progress Photo',
    description: 'Take your daily photo',
    icon: Camera,
    href: '/photos',
    color: 'bg-orange-500/10 text-orange-500',
    hoverColor: 'hover:bg-orange-500/20'
  }
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                asChild
                variant="outline"
                className={`w-full h-auto p-4 justify-start ${action.hoverColor} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group`}
              >
                <Link href={action.href}>
                  <div className="flex items-center gap-3 w-full">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 