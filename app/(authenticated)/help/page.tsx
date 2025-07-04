import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  FileText,
  ChevronRight,
  Search,
  ExternalLink
} from "lucide-react"

const commonQuestions = [
  {
    question: "How do I reset my progress if I fail?",
    answer: "Go to Settings > Challenge Progress and tap 'Reset Challenge'. This will start you back at Day 1."
  },
  {
    question: "Can I pause the challenge?",
    answer: "No, the 75 Hard challenge cannot be paused. If you miss a day, you must start over from Day 1."
  },
  {
    question: "How do I change my diet plan?",
    answer: "You can update your diet preferences in Settings > Diet Plan. Remember, once chosen, you must stick to it for all 75 days."
  },
  {
    question: "Is the app available offline?",
    answer: "Yes! The app works offline and will sync your progress when you reconnect to the internet."
  },
  {
    question: "How do I export my progress photos?",
    answer: "Go to Progress > Photos and tap the export button to save all your photos to your device."
  }
]

const helpResources = [
  {
    title: "Getting Started Guide",
    description: "Learn the basics of using the app",
    icon: <FileText className="h-5 w-5" />,
    href: "/guide"
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step walkthroughs",
    icon: <ExternalLink className="h-5 w-5" />,
    href: "#"
  },
  {
    title: "Community Forum",
    description: "Connect with other challengers",
    icon: <MessageCircle className="h-5 w-5" />,
    href: "#"
  }
]

export default function HelpPage() {
  return (
    <div className="container px-4 md:px-6 py-6 md:py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground">
          Find answers and get assistance with your journey
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search for Help
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              placeholder="Search for answers..." 
              className="flex-1"
            />
            <Button>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Common Questions */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {commonQuestions.map((item, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{item.question}</CardTitle>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Help Resources */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Helpful Resources</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {helpResources.map((resource, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {resource.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{resource.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {resource.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Support
          </CardTitle>
          <CardDescription>
            Can&apos;t find what you&apos;re looking for? Send us a message.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Your Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="your@email.com" 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input 
              id="subject" 
              placeholder="How can we help?" 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea 
              id="message" 
              placeholder="Describe your issue or question..." 
              rows={5}
            />
          </div>
          <Button className="w-full">
            Send Message
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}