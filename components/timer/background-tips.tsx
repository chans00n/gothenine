import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function BackgroundTips() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Alert className="mb-4 cursor-pointer hover:bg-muted/50 transition-colors">
          <Info className="h-4 w-4" />
          <AlertTitle>Background Tracking Tips</AlertTitle>
          <AlertDescription className="text-xs">
            Tap to learn how to keep timers running in background
          </AlertDescription>
        </Alert>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Keep Timers Running
          </DialogTitle>
          <DialogDescription>
            Follow these tips to prevent your timer from stopping
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">For Best Results:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Keep the app open in Safari/Chrome while exercising</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Don't switch to other apps or lock your screen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Enable "Prevent Auto-Lock" in your device settings while using the timer</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">iOS Specific:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Add this app to your Home Screen for better performance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Allow notifications when prompted for timer alerts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>The timer will try to continue when you return to the app</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Alternative Options:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Use a dedicated fitness app alongside for GPS tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Manually enter your distance after completing the walk</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Take a screenshot of your progress before closing the app</span>
              </li>
            </ul>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Due to iOS/Safari limitations, true background tracking isn't possible for web apps. 
              We've implemented screen wake lock and other tricks to help keep the timer running.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  )
}