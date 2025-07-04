"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  FileX, 
  Search, 
  Inbox,
  Calendar,
  CheckCircle,
  Trophy,
  Image,
  Users,
  LucideIcon
} from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        "min-h-[300px]",
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}

// Preset empty states
export function NoTasksEmpty({ onCreateTask }: { onCreateTask?: () => void }) {
  return (
    <EmptyState
      icon={CheckCircle}
      title="No tasks yet"
      description="Start your 75 Hard journey by creating your first daily task"
      action={
        onCreateTask
          ? {
              label: "Create First Task",
              onClick: onCreateTask
            }
          : undefined
      }
    />
  )
}

export function NoResultsEmpty({ 
  searchTerm,
  onClear 
}: { 
  searchTerm?: string
  onClear?: () => void 
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        searchTerm 
          ? `No results for "${searchTerm}". Try different keywords.`
          : "Try adjusting your search or filters"
      }
      action={
        onClear
          ? {
              label: "Clear Search",
              onClick: onClear
            }
          : undefined
      }
    />
  )
}

export function NoDataEmpty() {
  return (
    <EmptyState
      icon={FileX}
      title="No data available"
      description="There's no data to display at the moment"
    />
  )
}

export function NoPhotosEmpty({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={Image}
      title="No photos yet"
      description="Upload your first progress photo to track your transformation"
      action={
        onUpload
          ? {
              label: "Upload Photo",
              onClick: onUpload
            }
          : undefined
      }
    />
  )
}

export function NoAchievementsEmpty() {
  return (
    <EmptyState
      icon={Trophy}
      title="No achievements yet"
      description="Complete your daily tasks to unlock achievements"
    />
  )
}

export function NoActivityEmpty() {
  return (
    <EmptyState
      icon={Calendar}
      title="No activity"
      description="Your activity history will appear here once you start tracking"
    />
  )
}

// Card empty state
export function CardEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  className
}: Omit<EmptyStateProps, "action">) {
  return (
    <div className={cn(
      "rounded-lg border-2 border-dashed border-muted-foreground/25",
      "flex flex-col items-center justify-center p-8 text-center",
      "min-h-[200px]",
      className
    )}>
      <Icon className="h-10 w-10 text-muted-foreground/50 mb-4" />
      <h4 className="font-medium text-muted-foreground mb-1">{title}</h4>
      {description && (
        <p className="text-sm text-muted-foreground/75">
          {description}
        </p>
      )}
    </div>
  )
}

// List empty state
export function ListEmptyState({ 
  message = "No items to display" 
}: { 
  message?: string 
}) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// Illustration empty state (for more visual impact)
export function IllustrationEmptyState({
  title,
  description,
  action,
  illustration
}: EmptyStateProps & { illustration?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      {illustration || (
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-6" />
      )}
      <h3 className="font-semibold text-xl mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}