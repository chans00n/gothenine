"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: boolean
  onRetry?: (attempt: number) => void
  onMaxRetriesReached?: () => void
}

interface RetryState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  attempt: number
  retry: () => Promise<void>
  reset: () => void
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): RetryState<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    onRetry,
    onMaxRetriesReached
  } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(async (attemptNumber: number = 1) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(null)
    setAttempt(attemptNumber)

    try {
      const result = await fn()
      setData(result)
      setError(null)
      return
    } catch (err) {
      const error = err as Error

      // Don't retry if aborted
      if (error.name === 'AbortError') {
        return
      }

      setError(error)

      if (attemptNumber < maxAttempts) {
        onRetry?.(attemptNumber)
        
        // Calculate delay with exponential backoff
        const retryDelay = backoff 
          ? delay * Math.pow(2, attemptNumber - 1)
          : delay

        await new Promise(resolve => setTimeout(resolve, retryDelay))

        // Retry if not aborted
        if (!abortControllerRef.current?.signal.aborted) {
          await execute(attemptNumber + 1)
        }
      } else {
        onMaxRetriesReached?.()
      }
    } finally {
      setIsLoading(false)
    }
  }, [fn, maxAttempts, delay, backoff, onRetry, onMaxRetriesReached])

  const retry = useCallback(async () => {
    await execute(1)
  }, [execute])

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setData(null)
    setError(null)
    setIsLoading(false)
    setAttempt(0)
  }, [])

  return {
    data,
    error,
    isLoading,
    attempt,
    retry,
    reset
  }
}

// Hook for automatic retry with exponential backoff
export function useAutoRetry<T>(
  fn: () => Promise<T>,
  deps: any[] = [],
  options: RetryOptions = {}
) {
  const retry = useRetry(fn, options)

  useEffect(() => {
    retry.retry()
    
    return () => {
      retry.reset()
    }
  }, deps)

  return retry
}

