import { Card, CardContent } from '@/components/ui/card'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MinusCircle, 
  Circle 
} from 'lucide-react'

const legendItems = [
  {
    icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    label: 'Complete',
    description: 'All 6 tasks completed',
    color: 'bg-green-50 dark:bg-green-950/20 border-green-500/30'
  },
  {
    icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
    label: 'Partial',
    description: 'Some tasks completed',
    color: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500/30'
  },
  {
    icon: <XCircle className="h-4 w-4 text-red-600" />,
    label: 'Incomplete',
    description: 'No tasks completed',
    color: 'bg-red-50 dark:bg-red-950/20 border-red-500/30'
  },
  {
    icon: <MinusCircle className="h-4 w-4 text-gray-500" />,
    label: 'Skipped',
    description: 'Day was skipped',
    color: 'bg-gray-100/50 dark:bg-gray-900/20 border-gray-300'
  },
  {
    icon: <Circle className="h-4 w-4 text-blue-600 animate-pulse" />,
    label: 'Today',
    description: 'Current day',
    color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-500'
  },
  {
    icon: <Circle className="h-4 w-4 text-muted-foreground/50" />,
    label: 'Future',
    description: 'Upcoming days',
    color: 'bg-muted/30 border-border/50'
  }
]

export function CalendarLegend() {
  return (
    <Card>
      <CardContent className="pt-4">
        <h3 className="font-medium mb-3 text-sm">Calendar Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {legendItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-2 rounded-md border ${item.color}`}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs">{item.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}