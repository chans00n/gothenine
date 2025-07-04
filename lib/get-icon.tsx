import { 
  Dumbbell, 
  Footprints, 
  BookOpen, 
  Camera, 
  Droplets,
  Apple,
  Brain,
  Beer,
  LucideIcon
} from "lucide-react"
import type { IconName } from "@/types/tasks"

const iconMap: Record<IconName, LucideIcon> = {
  Dumbbell,
  Footprints,
  BookOpen,
  Camera,
  Droplets,
  Apple,
  Brain,
  Beer
}

export function getIcon(name: IconName): LucideIcon {
  return iconMap[name] || Dumbbell
}