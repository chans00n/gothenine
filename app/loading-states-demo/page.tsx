"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Spinner, 
  DotsSpinner, 
  PulseSpinner, 
  ProgressSpinner,
  ButtonLoader 
} from "@/components/ui/loading-spinner"
import {
  TextSkeleton,
  ListSkeleton,
  CardSkeleton,
  StatsSkeleton,
  TableSkeleton,
  FormSkeleton
} from "@/components/ui/skeleton-variants"
import {
  ErrorBoundary,
  ErrorFallback,
  InlineError,
  NetworkError
} from "@/components/ui/error-boundary"
import {
  EmptyState,
  NoTasksEmpty,
  NoResultsEmpty,
  NoPhotosEmpty,
  CardEmptyState
} from "@/components/ui/empty-state"
import {
  OfflineBanner,
  OfflineIndicator,
  SyncIndicator,
  OfflineCard
} from "@/components/ui/offline-indicator"
import { useRetry } from "@/hooks/use-retry"
import { toast } from "@/lib/toast"

// Simulate async operation
const simulateAsync = (shouldFail = false, delay = 2000): Promise<{ data: string }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error("Simulated error occurred"))
      } else {
        resolve({ data: "Success!" })
      }
    }, delay)
  })
}

export default function LoadingStatesDemoPage() {
  const [loading, setLoading] = useState(false)
  const [showError, setShowError] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle")

  const retryDemo = useRetry(
    () => simulateAsync(showError, 1000),
    {
      maxAttempts: 3,
      onRetry: (attempt) => {
        toast.info(`Retrying...`, `Attempt ${attempt + 1} of 3`)
      },
      onMaxRetriesReached: () => {
        toast.error("Max retries reached", "Please try again later")
      }
    }
  )

  const handleLoadingDemo = async () => {
    setLoading(true)
    await simulateAsync(false, 2000)
    setLoading(false)
    toast.success("Loading complete!")
  }

  const handleSyncDemo = async () => {
    setSyncStatus("syncing")
    await simulateAsync(false, 2000)
    setSyncStatus("synced")
    setTimeout(() => setSyncStatus("idle"), 3000)
  }

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Loading States & Error Handling</h1>
          <p className="text-muted-foreground">
            Comprehensive demonstration of loading patterns, error states, and offline indicators
          </p>
        </div>

        <Tabs defaultValue="loading" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="loading">Loading</TabsTrigger>
            <TabsTrigger value="skeleton">Skeletons</TabsTrigger>
            <TabsTrigger value="error">Errors</TabsTrigger>
            <TabsTrigger value="empty">Empty States</TabsTrigger>
          </TabsList>

          {/* Loading States Tab */}
          <TabsContent value="loading" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Spinner Variants</CardTitle>
                <CardDescription>Different loading spinner styles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="text-center">
                    <Spinner size="md" />
                    <p className="text-sm mt-2">Basic</p>
                  </div>
                  <div className="text-center">
                    <DotsSpinner size="md" />
                    <p className="text-sm mt-2">Dots</p>
                  </div>
                  <div className="text-center">
                    <PulseSpinner size="md" />
                    <p className="text-sm mt-2">Pulse</p>
                  </div>
                  <div className="text-center">
                    <ProgressSpinner size="md" progress={65} />
                    <p className="text-sm mt-2">Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Button Loading State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleLoadingDemo} disabled={loading}>
                  <ButtonLoader loading={loading} loadingText="Processing...">
                    Click to Load
                  </ButtonLoader>
                </Button>
                <p className="text-sm text-muted-foreground">
                  Click the button to see loading state
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skeleton States Tab */}
          <TabsContent value="skeleton" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Text Skeleton</CardTitle>
                </CardHeader>
                <CardContent>
                  <TextSkeleton lines={4} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>List Skeleton</CardTitle>
                </CardHeader>
                <CardContent>
                  <ListSkeleton items={3} showAvatar />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stats Skeleton</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatsSkeleton columns={2} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Form Skeleton</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormSkeleton fields={2} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Card Skeleton</CardTitle>
              </CardHeader>
              <CardContent>
                <CardSkeleton />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Error States Tab */}
          <TabsContent value="error" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Error Boundary</CardTitle>
              </CardHeader>
              <CardContent>
                <ErrorBoundary>
                  {showError ? (
                    <ErrorFallback 
                      error={new Error("This is a test error")} 
                      reset={() => setShowError(false)}
                    />
                  ) : (
                    <div className="text-center p-8">
                      <p className="mb-4">Click to trigger error boundary</p>
                      <Button onClick={() => setShowError(true)} variant="destructive">
                        Trigger Error
                      </Button>
                    </div>
                  )}
                </ErrorBoundary>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inline Error</CardTitle>
              </CardHeader>
              <CardContent>
                <InlineError 
                  error="This is an inline error message" 
                  retry={() => toast.info("Retry clicked")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Error</CardTitle>
              </CardHeader>
              <CardContent>
                <NetworkError retry={() => toast.info("Retry network request")} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retry Mechanism</CardTitle>
                <CardDescription>
                  Automatic retry with exponential backoff
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm">Simulate failure:</label>
                  <input
                    type="checkbox"
                    checked={showError}
                    onChange={(e) => setShowError(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                
                {retryDemo.isLoading && (
                  <div className="text-center p-4">
                    <Spinner />
                    <p className="text-sm mt-2">Attempt {retryDemo.attempt} of 3</p>
                  </div>
                )}
                
                {retryDemo.error && (
                  <InlineError error={retryDemo.error} retry={retryDemo.retry} />
                )}
                
                {retryDemo.data && (
                  <div className="p-4 bg-green-500/10 rounded-lg text-green-600">
                    Success! Data loaded.
                  </div>
                )}
                
                <Button onClick={retryDemo.retry}>
                  Start Retry Demo
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Empty States Tab */}
          <TabsContent value="empty" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>No Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <NoTasksEmpty onCreateTask={() => toast.info("Create task clicked")} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>No Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <NoResultsEmpty 
                    searchTerm="workout" 
                    onClear={() => toast.info("Clear search")}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>No Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <NoPhotosEmpty onUpload={() => toast.info("Upload photo")} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Card Empty State</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardEmptyState 
                    title="No data available"
                    description="Start by adding some items"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Offline Indicators */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Offline & Sync Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-8">
              <OfflineIndicator />
              <SyncIndicator status={syncStatus} />
              <Button onClick={handleSyncDemo} size="sm">
                Simulate Sync
              </Button>
            </div>
            
            <OfflineCard>
              <div className="p-8 text-center">
                <p>This content is disabled when offline</p>
              </div>
            </OfflineCard>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}