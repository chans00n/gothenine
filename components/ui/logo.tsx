"use client"

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export function Logo({ className = "", width = 120, height = 40 }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className={`${className}`} style={{ width, height }} />
  }

  const logoSrc = resolvedTheme === 'dark' 
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