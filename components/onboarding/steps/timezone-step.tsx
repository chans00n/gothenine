"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, MapPin, Search } from 'lucide-react'
import type { OnboardingData } from '../onboarding-flow'

interface TimezoneStepProps {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
  onNext: () => void
}

// Common timezones
const commonTimezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8' },
  { value: 'Europe/London', label: 'London (GMT)', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'Central European Time', offset: 'UTC+1' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time', offset: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time', offset: 'UTC+10' }
]

export function TimezoneStep({ data, updateData }: TimezoneStepProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [detectedTimezone, setDetectedTimezone] = useState<string>('')

  useEffect(() => {
    // Detect user's timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    setDetectedTimezone(tz)
    if (!data.timezone) {
      updateData({ timezone: tz })
    }
  }, [data.timezone, updateData])

  const filteredTimezones = commonTimezones.filter(tz =>
    tz.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tz.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Set Your Time Zone</h2>
        <p className="text-muted-foreground">
          This ensures reminders arrive at the right time
        </p>
      </div>

      {detectedTimezone && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Detected timezone</p>
            </div>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => updateData({ timezone: detectedTimezone })}
            >
              {detectedTimezone}
              {data.timezone === detectedTimezone && (
                <span className="ml-auto text-xs text-green-600">Selected</span>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Choose Your Time Zone</CardTitle>
          <CardDescription>
            Select from common timezones or search for yours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search timezones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredTimezones.map((tz) => (
              <Button
                key={tz.value}
                variant={data.timezone === tz.value ? 'default' : 'outline'}
                className="w-full justify-between"
                onClick={() => updateData({ timezone: tz.value })}
              >
                <span className="text-left">
                  <span className="font-medium">{tz.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {tz.offset}
                  </span>
                </span>
                {data.timezone === tz.value && (
                  <span className="text-xs">Selected</span>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}