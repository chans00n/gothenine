"use client"

import Image from 'next/image'
import { useTheme } from '@/components/theme-provider'
import { useEffect, useState } from 'react'

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export function Logo({ className = "", width = 120, height = 40 }: LogoProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Check if dark mode is active
    if (theme === 'dark') {
      setIsDark(true)
    } else if (theme === 'light') {
      setIsDark(false)
    } else if (theme === 'system') {
      // Check system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setIsDark(mediaQuery.matches)
      
      // Listen for changes
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [theme])

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className={`${className}`} style={{ width, height }} />
  }

  const logoSrc = isDark 
    ? '/gothe09-logo-white.png' 
    : '/gothe09-logo-black.png'

  return (
    <Image
      src={logoSrc}
      alt="Go the Nine"
      width={width}
      height={height}
      className={className}
      priority
    />
  )
}