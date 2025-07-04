export enum TaskCategory {
  WORKOUT_INDOOR = "workout_indoor",
  WORKOUT_OUTDOOR = "workout_outdoor",
  DIET = "diet",
  WATER = "water",
  READING = "reading",
  PROGRESS_PHOTO = "progress_photo",
}

export type IconName = 
  | "Dumbbell" 
  | "Footprints" 
  | "BookOpen" 
  | "Camera" 
  | "Droplets" 
  | "Apple"
  | "Brain"
  | "Beer"

export interface TaskDefinition {
  id: string
  title: string
  description: string
  category: TaskCategory
  iconName: IconName
  color: string
  requiresDuration?: boolean
  requiredDuration?: number // in minutes
  requiresPhoto?: boolean
  requiresNotes?: boolean
}

export interface DailyTask {
  id: string
  taskDefinitionId: string
  completed: boolean
  completedAt?: Date
  duration?: number // in minutes
  notes?: string
  photoUrl?: string
}

export interface TaskProgress {
  totalTasks: number
  completedTasks: number
  percentage: number
  remainingTasks: number
}