export enum DayStatus {
  COMPLETE = "complete",
  INCOMPLETE = "incomplete", 
  PARTIAL = "partial",
  FUTURE = "future",
  TODAY = "today",
  SKIPPED = "skipped"
}

export interface CalendarDay {
  dayNumber: number
  date: Date | string  // Can be either Date object or ISO string
  status: DayStatus
  tasksCompleted?: number
  totalTasks?: number
  notes?: string
  hidden?: boolean
}

export interface CalendarMonth {
  name: string
  year: number
  days: CalendarDay[]
  startOffset: number // Number of empty cells before first day
}