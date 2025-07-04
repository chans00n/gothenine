"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, FileJson, FileText, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

interface DataExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: any
  dateRange: DateRange
  userName: string
}

type ExportFormat = 'json' | 'csv' | 'pdf'

export function DataExportDialog({
  open,
  onOpenChange,
  data,
  dateRange,
  userName
}: DataExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [includePhotos, setIncludePhotos] = useState(false)
  const [includeNotes, setIncludeNotes] = useState(true)
  const [includeStats, setIncludeStats] = useState(true)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    
    try {
      let exportData: any = {
        user: userName,
        dateRange: {
          from: format(dateRange.from!, 'yyyy-MM-dd'),
          to: format(dateRange.to!, 'yyyy-MM-dd')
        },
        exportDate: new Date().toISOString()
      }

      if (includeStats) {
        exportData.statistics = {
          totalDays: data.totalDays,
          completedDays: data.completedDays,
          completionRate: data.completionRate,
          bestStreak: data.bestStreak,
          averageTasksPerDay: data.averageTasksPerDay
        }
      }

      if (includeNotes || includePhotos) {
        exportData.dailyProgress = data.dailyProgress
      }

      switch (exportFormat) {
        case 'json':
          exportAsJSON(exportData)
          break
        case 'csv':
          exportAsCSV(exportData)
          break
        case 'pdf':
          toast.error('PDF export coming soon!')
          break
      }

      toast.success(`Data exported as ${exportFormat.toUpperCase()}`)
      onOpenChange(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const exportAsJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `75hard-progress-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportAsCSV = (data: any) => {
    // Create CSV headers
    const headers = ['Date', 'Day #', 'Completed', 'Tasks Completed', 'Completion %']
    if (includeNotes) headers.push('Notes')
    
    // Create CSV rows
    const rows = data.dailyProgress.map((day: any) => {
      const row = [
        format(new Date(day.date), 'yyyy-MM-dd'),
        day.dayNumber,
        day.isComplete ? 'Yes' : 'No',
        day.tasksCompleted,
        Math.round(day.completionRate) + '%'
      ]
      if (includeNotes && day.notes) row.push(`"${day.notes.replace(/"/g, '""')}"`)
      return row.join(',')
    })

    // Add summary section
    if (includeStats) {
      rows.push('') // Empty row
      rows.push('Summary Statistics')
      rows.push(`Total Days,${data.totalDays}`)
      rows.push(`Completed Days,${data.completedDays}`)
      rows.push(`Completion Rate,${Math.round(data.completionRate)}%`)
      rows.push(`Best Streak,${data.bestStreak} days`)
      rows.push(`Average Tasks/Day,${data.averageTasksPerDay.toFixed(1)}`)
    }

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `75hard-progress-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Progress Data</DialogTitle>
          <DialogDescription>
            Choose export format and options for your progress data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Excel compatible)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  <FileJson className="h-4 w-4" />
                  JSON (Raw data)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" disabled />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer opacity-50">
                  <FileText className="h-4 w-4" />
                  PDF Report (Coming soon)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="stats" 
                  checked={includeStats}
                  onCheckedChange={(checked) => setIncludeStats(checked as boolean)}
                />
                <Label htmlFor="stats" className="cursor-pointer">
                  Summary statistics
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notes" 
                  checked={includeNotes}
                  onCheckedChange={(checked) => setIncludeNotes(checked as boolean)}
                />
                <Label htmlFor="notes" className="cursor-pointer">
                  Daily notes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="photos" 
                  checked={includePhotos}
                  onCheckedChange={(checked) => setIncludePhotos(checked as boolean)}
                  disabled
                />
                <Label htmlFor="photos" className="cursor-pointer opacity-50">
                  Photo URLs (Coming soon)
                </Label>
              </div>
            </div>
          </div>

          {/* Date Range Info */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-1">Export Range</p>
            <p className="text-muted-foreground">
              {format(dateRange.from!, 'MMM d, yyyy')} - {format(dateRange.to!, 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}