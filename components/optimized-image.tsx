"use client"

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  quality?: number
  sizes?: string
  fill?: boolean
  onLoadComplete?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  quality = 75,
  sizes,
  fill = false,
  onLoadComplete,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoadComplete = () => {
    setIsLoading(false)
    onLoadComplete?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  // Generate placeholder for better loading experience
  const generatePlaceholder = (w: number, h: number) => {
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f4f4f4"/>
        <text x="50%" y="50%" font-size="14" fill="#999999" text-anchor="middle" dy=".3em">
          Loading...
        </text>
      </svg>
    `
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  }

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground border border-border rounded",
          className
        )}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <div className="text-sm">Failed to load image</div>
          <div className="text-xs mt-1">{alt}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && !hasError && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-xs text-muted-foreground">Loading...</div>
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        placeholder={placeholder}
        blurDataURL={blurDataURL || (placeholder === 'blur' ? generatePlaceholder(width, height) : undefined)}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          fill ? "object-cover" : ""
        )}
        onLoad={handleLoadComplete}
        onError={handleError}
        style={fill ? undefined : { width, height }}
      />
    </div>
  )
}

// Specialized components for common use cases
export function ProgressPhoto({
  src,
  alt,
  date,
  className,
  onLoadComplete,
}: {
  src: string
  alt: string
  date?: string
  className?: string
  onLoadComplete?: () => void
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={300}
        height={400}
        className="rounded-lg border"
        quality={85}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        placeholder="blur"
        onLoadComplete={onLoadComplete}
      />
      {date && (
        <div className="text-xs text-muted-foreground text-center">
          {date}
        </div>
      )}
    </div>
  )
}

export function Avatar({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      quality={90}
      priority={true}
    />
  )
}

export function Hero({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <div className={cn("relative w-full h-64 md:h-96", className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill={true}
        className="object-cover"
        quality={90}
        priority={true}
        sizes="100vw"
        placeholder="blur"
      />
    </div>
  )
}