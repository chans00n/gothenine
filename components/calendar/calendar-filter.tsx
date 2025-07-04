"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DayStatus } from '@/types/calendar'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MinusCircle, 
  Circle,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarFilterProps {
  activeFilters: DayStatus[]
  onFilterChange: (filters: DayStatus[]) => void
}

const filterOptions = [
  {
    status: DayStatus.COMPLETE,
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'Complete',
    color: 'text-green-600'
  },
  {
    status: DayStatus.PARTIAL,
    icon: <AlertCircle className="h-4 w-4" />,
    label: 'Partial',
    color: 'text-yellow-600'
  },
  {
    status: DayStatus.INCOMPLETE,
    icon: <XCircle className="h-4 w-4" />,
    label: 'Incomplete',
    color: 'text-red-600'
  },
  {
    status: DayStatus.SKIPPED,
    icon: <MinusCircle className="h-4 w-4" />,
    label: 'Skipped',
    color: 'text-gray-500'
  }
]

export function CalendarFilter({ activeFilters, onFilterChange }: CalendarFilterProps) {
  const toggleFilter = (status: DayStatus) => {
    if (activeFilters.includes(status)) {
      onFilterChange(activeFilters.filter(f => f !== status))
    } else {
      onFilterChange([...activeFilters, status])
    }
  }

  const clearFilters = () => {
    onFilterChange([])
  }

  const hasActiveFilters = activeFilters.length > 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Filter Progress</h3>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const isActive = activeFilters.includes(option.status)
            return (
              <Button
                key={option.status}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(option.status)}
                className={cn(
                  "gap-1.5",
                  !isActive && option.color
                )}
              >
                <span className={isActive ? "" : option.color}>
                  {option.icon}
                </span>
                {option.label}
              </Button>
            )
          })}
        </div>

        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground mt-3">
            Showing {activeFilters.length} of 4 status types
          </p>
        )}
      </CardContent>
    </Card>
  )
}