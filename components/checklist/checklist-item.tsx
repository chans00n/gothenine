"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { 
  Clock, 
  Camera, 
  FileText, 
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight
} from "lucide-react"
import type { TaskDefinition, DailyTask } from "@/types/tasks"
import { getIcon } from "@/lib/get-icon"
import Link from "next/link"

interface ChecklistItemProps {
  task: TaskDefinition
  dailyTask: DailyTask
  onToggle: (taskId: string, completed: boolean) => void
  onUpdateDuration?: (taskId: string, duration: number) => void
  onAddPhoto?: (taskId: string) => void
  onAddNotes?: (taskId: string, notes: string) => void
}

// Helper function to get quick action links
function getQuickActionLink(taskId: string): string | null {
  switch (taskId) {
    case 'workout-indoor':
      return '/timer'
    case 'workout-outdoor':
      return '/walk'
    case 'water-intake':
      return '/water'
    case 'progress-photo':
      return '/photos'
    default:
      return null
  }
}

export function ChecklistItem({
  task,
  dailyTask,
  onToggle,
  onUpdateDuration,
  onAddPhoto,
  onAddNotes,
}: ChecklistItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [duration, setDuration] = useState(dailyTask.duration || task.requiredDuration || 0)
  const [notes, setNotes] = useState(dailyTask.notes || "")

  const TaskIcon = getIcon(task.iconName)
  const isCompleted = dailyTask.completed

  const handleToggle = () => {
    onToggle(dailyTask.id, !isCompleted)
  }

  const handleDurationChange = (value: string) => {
    const newDuration = parseInt(value) || 0
    setDuration(newDuration)
    onUpdateDuration?.(dailyTask.id, newDuration)
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    onAddNotes?.(dailyTask.id, value)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "rounded-lg border transition-all duration-200",
        isCompleted 
          ? "bg-muted/50 border-muted-foreground/20" 
          : "bg-card hover:shadow-md"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Custom Checkbox */}
          <div className="pt-0.5">
            <Checkbox
              id={dailyTask.id}
              checked={isCompleted}
              onCheckedChange={handleToggle}
              className={cn(
                "h-5 w-5 rounded-md transition-all duration-200",
                isCompleted && "bg-green-500 border-green-500"
              )}
            />
          </div>

          {/* Task Content */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md", task.color)}>
                <TaskIcon className="h-4 w-4" />
              </div>
              <Label
                htmlFor={dailyTask.id}
                className={cn(
                  "text-base font-medium cursor-pointer transition-all",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </Label>
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </motion.div>
              )}
            </div>
            
            <p className={cn(
              "text-sm text-muted-foreground",
              isCompleted && "line-through"
            )}>
              {task.description}
            </p>

            {/* Task Actions */}
            {(task.requiresDuration || task.requiresPhoto || task.requiresNotes || getQuickActionLink(task.id)) && (
              <div className="flex items-center gap-2 mt-2">
                {task.requiresDuration && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{duration || task.requiredDuration} min</span>
                  </div>
                )}
                {task.requiresPhoto && dailyTask.photoUrl && (
                  <div className="flex items-center gap-1.5 text-sm text-green-600">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Photo added</span>
                  </div>
                )}
                {task.requiresNotes && notes && (
                  <div className="flex items-center gap-1.5 text-sm text-blue-600">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Notes added</span>
                  </div>
                )}
                {!isCompleted && getQuickActionLink(task.id) && (
                  <Link 
                    href={getQuickActionLink(task.id)!}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span>Track</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Expand/Collapse Button */}
          {(task.requiresDuration || task.requiresPhoto || task.requiresNotes) && !isCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && !isCompleted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 pl-8 space-y-3">
                {task.requiresDuration && (
                  <div className="space-y-1.5">
                    <Label htmlFor={`${dailyTask.id}-duration`} className="text-sm">
                      Duration (minutes)
                    </Label>
                    <Input
                      id={`${dailyTask.id}-duration`}
                      type="number"
                      min="0"
                      value={duration}
                      onChange={(e) => handleDurationChange(e.target.value)}
                      className="w-32"
                      placeholder={`Min ${task.requiredDuration || 0} min`}
                    />
                  </div>
                )}

                {task.requiresPhoto && (
                  <div className="space-y-1.5">
                    <Label className="text-sm">Progress Photo</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddPhoto?.(dailyTask.id)}
                      className="gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      {dailyTask.photoUrl ? "Change Photo" : "Add Photo"}
                    </Button>
                  </div>
                )}

                {task.requiresNotes && (
                  <div className="space-y-1.5">
                    <Label htmlFor={`${dailyTask.id}-notes`} className="text-sm">
                      Notes
                    </Label>
                    <textarea
                      id={`${dailyTask.id}-notes`}
                      value={notes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Add notes about this task..."
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Completion Animation Overlay */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-1 bg-green-500 rounded-b-lg origin-left"
            style={{ marginTop: "-4px" }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}