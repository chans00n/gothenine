"use client"

import { useState, useEffect } from 'react'
import { DateRange } from 'react-day-picker'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Download, Filter, Calendar, TrendingUp, Image } from 'lucide-react'
import { statisticsService } from '@/lib/services/statistics-client'
import { HistoricalChart } from './historical-chart'
import { HistoricalStats } from './historical-stats'
import { HistoricalPhotoGallery } from './historical-photo-gallery'
import { ProgressTimeline } from './progress-timeline'
import { DataExportDialog } from './data-export-dialog'
import { toast } from 'sonner'

interface HistoricalProgressViewProps {
  challengeId: string
  startDate: Date
  timezone: string
  userName: string
}

export function HistoricalProgressView({
  challengeId,
  startDate,
  timezone,
  userName
}: HistoricalProgressViewProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [historicalData, setHistoricalData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const datePresets = [
    {
      label: "Last 7 days",
      getValue: () => ({
        from: subDays(new Date(), 7),
        to: new Date()
      })
    },
    {
      label: "Last 30 days",
      getValue: () => ({
        from: subDays(new Date(), 30),
        to: new Date()
      })
    },
    {
      label: "Last 60 days",
      getValue: () => ({
        from: subDays(new Date(), 60),
        to: new Date()
      })
    },
    {
      label: "All time",
      getValue: () => ({
        from: startDate,
        to: new Date()
      })
    }
  ]

  useEffect(() => {
    async function loadHistoricalData() {
      if (!dateRange.from || !dateRange.to) return

      setLoading(true)
      try {
        const data = await statisticsService.getHistoricalData(
          challengeId,
          format(dateRange.from, 'yyyy-MM-dd'),
          format(dateRange.to, 'yyyy-MM-dd'),
          timezone
        )
        setHistoricalData(data)
      } catch (error) {
        console.error('Error loading historical data:', error)
        toast.error('Failed to load historical data')
      } finally {
        setLoading(false)
      }
    }

    loadHistoricalData()
  }, [challengeId, dateRange, timezone])

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range)
    }
  }

  return (
    <div className="space-y-6">
      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>
            Select a date range to view your historical progress
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <DateRangePicker
            date={dateRange}
            onDateChange={handleDateRangeChange}
            presets={datePresets}
          />
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
            disabled={!historicalData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </CardContent>
      </Card>

      {/* Historical Data Tabs */}
      {historicalData && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Calendar className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="photos">
              <Image className="h-4 w-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="compare">
              <Filter className="h-4 w-4 mr-2" />
              Compare
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <HistoricalStats data={historicalData} />
            <HistoricalChart data={historicalData} />
          </TabsContent>

          <TabsContent value="timeline">
            <ProgressTimeline 
              data={historicalData}
              timezone={timezone}
            />
          </TabsContent>

          <TabsContent value="photos">
            <HistoricalPhotoGallery
              challengeId={challengeId}
              dateRange={dateRange}
            />
          </TabsContent>

          <TabsContent value="compare">
            <Card>
              <CardHeader>
                <CardTitle>Period Comparison</CardTitle>
                <CardDescription>
                  Compare different time periods to track your improvement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Export Dialog */}
      <DataExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        data={historicalData}
        dateRange={dateRange}
        userName={userName}
      />
    </div>
  )
}