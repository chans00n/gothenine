import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Target, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Dumbbell,
  Apple,
  Droplets,
  Camera,
  Brain,
  Trophy
} from "lucide-react"

export default function GuidePage() {
  return (
    <div className="container px-4 md:px-6 py-6 md:py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">75 Hard Guide</h1>
        <p className="text-muted-foreground">
          Everything you need to know to complete the challenge
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                What is 75 Hard?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                75 Hard is a transformative mental toughness program created by Andy Frisella. 
                It&apos;s not just a fitness challenge – it&apos;s a program designed to build mental 
                fortitude, self-discipline, and confidence through 75 days of daily tasks.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Key Benefits:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Build unshakeable mental toughness
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Develop consistency and discipline
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Transform your physical health
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Gain confidence and self-respect
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Important to Remember
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span>If you miss any task, you must start over from Day 1</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span>No substitutions or modifications allowed</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span>This is about mental toughness, not just physical transformation</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          {/* Workout Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-blue-500" />
                Two 45-Minute Workouts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Badge variant="secondary">Indoor Workout</Badge>
                <p className="text-sm">Can be at home or in a gym</p>
              </div>
              <div className="space-y-2">
                <Badge variant="secondary">Outdoor Workout</Badge>
                <p className="text-sm">Must be outside, regardless of weather conditions</p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-lg">
                <p className="text-sm font-medium">⚠️ Important:</p>
                <ul className="text-sm mt-1 space-y-1">
                  <li>• Workouts must be at least 3 hours apart</li>
                  <li>• Walking counts as a workout</li>
                  <li>• No workout can count for both</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Diet Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5 text-red-500" />
                Follow a Diet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Choose any diet and stick to it for 75 days with:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  No cheat meals
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  No alcohol
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                The specific diet is your choice – keto, paleo, counting macros, etc. 
                The key is consistency and no deviations.
              </p>
            </CardContent>
          </Card>

          {/* Water Rule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-cyan-500" />
                Drink 1 Gallon of Water
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3">128 ounces (3.78 liters) of water daily</p>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <p className="text-sm">💡 Tip: Get a gallon jug and mark time goals on it</p>
              </div>
            </CardContent>
          </Card>

          {/* Reading Rule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                Read 10 Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3">10 pages of a non-fiction, self-development book</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Audio books don&apos;t count</li>
                <li>• Must be educational or self-improvement</li>
                <li>• Physical book or e-reader is fine</li>
              </ul>
            </CardContent>
          </Card>

          {/* Photo Rule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-orange-500" />
                Progress Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Take a daily progress photo to document your transformation</p>
              <p className="text-sm text-muted-foreground mt-2">
                Same time, same lighting, same poses for best comparison
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Mental Strategies
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>• Plan your day the night before</li>
                  <li>• Set alarms for water intake and workouts</li>
                  <li>• Have backup plans for busy days</li>
                  <li>• Remember: this is about keeping promises to yourself</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Practical Tips
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>• Prep meals in advance</li>
                  <li>• Keep workout clothes in your car</li>
                  <li>• Download books to your phone for reading on-the-go</li>
                  <li>• Take your photo at the same time daily</li>
                  <li>• Start drinking water early in the day</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Can I do yoga or stretching as a workout?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! Any intentional physical activity for 45 minutes counts. This includes yoga, 
                  walking, stretching, or traditional workouts.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">What if I&apos;m sick?</h4>
                <p className="text-sm text-muted-foreground">
                  The program requires no exceptions. If you&apos;re too sick to complete the tasks, 
                  you should start over when you&apos;re healthy. Your health comes first.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Can I drink other beverages?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, but they don&apos;t count toward your gallon of water. Coffee, tea, and other 
                  drinks are fine in addition to your water requirement.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">What happens after 75 days?</h4>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll have built incredible habits and mental toughness. Many people continue 
                  with modified versions or move on to Phase 1 of the Live Hard program.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}