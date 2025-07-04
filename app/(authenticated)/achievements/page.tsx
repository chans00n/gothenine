import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Flame, 
  Target, 
  Zap, 
  Award,
  Star,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Lock
} from "lucide-react"

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  progress: number
  total: number
  unlocked: boolean
  unlockedDate?: string
  category: "streak" | "milestone" | "special" | "completion"
}

const achievements: Achievement[] = [
  {
    id: "first-day",
    title: "First Step",
    description: "Complete your first day",
    icon: <Star className="h-6 w-6" />,
    progress: 1,
    total: 1,
    unlocked: true,
    unlockedDate: "2024-01-01",
    category: "milestone"
  },
  {
    id: "week-warrior",
    title: "Week Warrior",
    description: "Complete 7 consecutive days",
    icon: <Flame className="h-6 w-6" />,
    progress: 7,
    total: 7,
    unlocked: true,
    unlockedDate: "2024-01-07",
    category: "streak"
  },
  {
    id: "halfway-hero",
    title: "Halfway Hero",
    description: "Reach day 38 of the challenge",
    icon: <Target className="h-6 w-6" />,
    progress: 14,
    total: 38,
    unlocked: false,
    category: "milestone"
  },
  {
    id: "month-master",
    title: "Month Master",
    description: "Complete 30 consecutive days",
    icon: <Calendar className="h-6 w-6" />,
    progress: 14,
    total: 30,
    unlocked: false,
    category: "streak"
  },
  {
    id: "photo-perfectionist",
    title: "Photo Perfectionist",
    description: "Take 50 progress photos",
    icon: <Zap className="h-6 w-6" />,
    progress: 14,
    total: 50,
    unlocked: false,
    category: "special"
  },
  {
    id: "champion",
    title: "75 Hard Champion",
    description: "Complete all 75 days",
    icon: <Trophy className="h-6 w-6" />,
    progress: 14,
    total: 75,
    unlocked: false,
    category: "completion"
  }
]

const categoryColors = {
  streak: "bg-orange-500/10 text-orange-500",
  milestone: "bg-blue-500/10 text-blue-500",
  special: "bg-purple-500/10 text-purple-500",
  completion: "bg-green-500/10 text-green-500"
}

const categoryLabels = {
  streak: "Streak",
  milestone: "Milestone",
  special: "Special",
  completion: "Completion"
}

export default function AchievementsPage() {
  const totalAchievements = achievements.length
  const unlockedAchievements = achievements.filter(a => a.unlocked).length
  const overallProgress = (unlockedAchievements / totalAchievements) * 100

  return (
    <div className="container px-4 md:px-6 py-6 md:py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">
          Track your milestones and unlock rewards
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>
                {unlockedAchievements} of {totalAchievements} achievements unlocked
              </CardDescription>
            </div>
            <Award className="h-8 w-8 text-yellow-500" />
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {overallProgress.toFixed(0)}% Complete
          </p>
        </CardContent>
      </Card>

      {/* Achievement Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {achievements.map((achievement) => (
          <Card 
            key={achievement.id} 
            className={achievement.unlocked ? "border-primary/20" : "opacity-60"}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    achievement.unlocked 
                      ? categoryColors[achievement.category]
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {achievement.unlocked ? achievement.icon : <Lock className="h-6 w-6" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{achievement.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {achievement.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge 
                  variant={achievement.unlocked ? "default" : "outline"}
                  className="text-xs"
                >
                  {categoryLabels[achievement.category]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {achievement.progress} / {achievement.total}
                  </span>
                </div>
                <Progress 
                  value={(achievement.progress / achievement.total) * 100} 
                  className="h-2"
                />
                {achievement.unlocked && achievement.unlockedDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Motivational Section */}
      <Card className="mt-6 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="flex items-center gap-4 p-6">
          <TrendingUp className="h-10 w-10 text-primary" />
          <div>
            <h3 className="font-semibold text-lg">Keep Going!</h3>
            <p className="text-muted-foreground">
              Every achievement brings you closer to completing 75 Hard. You&apos;ve got this!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}