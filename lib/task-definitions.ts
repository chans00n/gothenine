import { TaskCategory, TaskDefinition } from "@/types/tasks"

export const taskDefinitions: TaskDefinition[] = [
  {
    id: "workout-indoor",
    title: "Indoor Workout",
    description: "Complete a 45-minute indoor workout",
    category: TaskCategory.WORKOUT_INDOOR,
    iconName: "Dumbbell",
    color: "bg-blue-500/10 text-blue-500",
    requiresDuration: true,
    requiredDuration: 45,
    requiresNotes: true
  },
  {
    id: "workout-outdoor",
    title: "Outdoor Workout",
    description: "Complete a 45-minute outdoor workout",
    category: TaskCategory.WORKOUT_OUTDOOR,
    iconName: "Footprints",
    color: "bg-green-500/10 text-green-500",
    requiresDuration: true,
    requiredDuration: 45,
    requiresNotes: true
  },
  {
    id: "read-nonfiction",
    title: "Read 10 Pages",
    description: "Read 10 pages of a non-fiction book",
    category: TaskCategory.READING,
    iconName: "BookOpen",
    color: "bg-purple-500/10 text-purple-500",
    requiresNotes: true
  },
  {
    id: "progress-photo",
    title: "Progress Photo",
    description: "Take a daily progress photo",
    category: TaskCategory.PROGRESS_PHOTO,
    iconName: "Camera",
    color: "bg-orange-500/10 text-orange-500",
    requiresPhoto: true
  },
  {
    id: "water-intake",
    title: "Water Intake",
    description: "Drink 1 gallon (3.78L) of water",
    category: TaskCategory.WATER,
    iconName: "Droplets",
    color: "bg-cyan-500/10 text-cyan-500",
    requiresNotes: false
  },
  {
    id: "follow-diet",
    title: "Follow Diet",
    description: "Stick to your chosen diet with no cheat meals or alcohol",
    category: TaskCategory.DIET,
    iconName: "Apple",
    color: "bg-red-500/10 text-red-500",
    requiresNotes: true
  }
]

// Helper function to create daily tasks from task definitions
export function createDailyTasks(dayNumber: number): Array<{
  id: string
  taskDefinitionId: string
  completed: boolean
}> {
  return taskDefinitions.map((task, index) => ({
    id: `day-${dayNumber}-task-${index}`,
    taskDefinitionId: task.id,
    completed: false
  }))
}

// Helper function to get task by category
export function getTasksByCategory(category: TaskCategory): TaskDefinition[] {
  return taskDefinitions.filter(task => task.category === category)
}

// Helper function to calculate if a day is complete
export function isDayComplete(dailyTasks: Array<{ completed: boolean }>): boolean {
  return dailyTasks.every(task => task.completed)
}