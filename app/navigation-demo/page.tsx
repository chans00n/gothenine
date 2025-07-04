"use client"

import { useState } from "react"
import { AppLayout, FloatingLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/toast"

export default function NavigationDemoPage() {
  const [layoutType, setLayoutType] = useState<"fixed" | "floating">("fixed")

  const Layout = layoutType === "fixed" ? AppLayout : FloatingLayout

  return (
    <Layout title="Navigation Demo">
      <div className="container px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mobile Navigation Demo</h1>
          <p className="text-muted-foreground mt-2">
            PWA-optimized navigation components with touch interactions
          </p>
        </div>

        {/* Layout Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation Style</CardTitle>
            <CardDescription>Choose between fixed or floating navigation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={layoutType === "fixed" ? "default" : "outline"}
                onClick={() => setLayoutType("fixed")}
              >
                Fixed Bottom Nav
              </Button>
              <Button
                variant={layoutType === "floating" ? "default" : "outline"}
                onClick={() => setLayoutType("floating")}
              >
                Floating Nav
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bottom Navigation Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Fixed position with backdrop blur</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Active state with animated indicator</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Touch ripple effects</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Badge support for notifications</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Safe area padding for devices</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Responsive - hidden on desktop</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hamburger Menu Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Slide-out sheet menu</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Theme toggle integration</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Grouped menu sections</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>PWA install prompt</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Animated menu items</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Notification badges</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accessibility */}
        <Card>
          <CardHeader>
            <CardTitle>Accessibility Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">ARIA Support</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• aria-label for all interactive elements</li>
                  <li>• aria-current for active navigation items</li>
                  <li>• aria-expanded for menu state</li>
                  <li>• Semantic navigation landmarks</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Keyboard Navigation</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Tab navigation support</li>
                  <li>• Focus ring indicators</li>
                  <li>• Escape key to close menu</li>
                  <li>• Enter/Space to activate</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Touch Interactions */}
        <Card>
          <CardHeader>
            <CardTitle>Touch Interactions</CardTitle>
            <CardDescription>
              Try these interactions on a touch device or using device emulation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => toast.success("Touch feedback", "Button pressed with touch feedback")}
            >
              Test Touch Feedback
            </Button>
            <p className="text-sm text-muted-foreground">
              Navigation items include:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Tap animations with scale effects</li>
              <li>• Touch ripple effects on navigation items</li>
              <li>• Swipe gestures for sheet menu</li>
              <li>• Hover states for pointer devices</li>
              <li>• Active states for touch feedback</li>
            </ul>
          </CardContent>
        </Card>

        {/* Demo Content */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Demo Content</h2>
          <p className="text-muted-foreground">
            Scroll down to see how the navigation stays fixed at the bottom on mobile devices.
            The bottom navigation is hidden on desktop viewports and replaced with a traditional
            navigation in the header.
          </p>
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <h3 className="font-medium mb-2">Content Block {i + 1}</h3>
                <p className="text-sm text-muted-foreground">
                  This is example content to demonstrate scrolling behavior with fixed navigation.
                  The bottom navigation remains accessible while scrolling through content.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  )
}