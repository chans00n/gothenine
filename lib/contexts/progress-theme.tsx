"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

export type ProgressTheme = 'default' | 'fire' | 'ocean' | 'forest' | 'sunset' | 'midnight'

interface ThemeColors {
  primary: string
  secondary: string
  success: string
  warning: string
  danger: string
  gradient: string
  ringGradient: string
}

const themes: Record<ProgressTheme, ThemeColors> = {
  default: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    success: 'rgb(34 197 94)',
    warning: 'rgb(234 179 8)',
    danger: 'rgb(239 68 68)',
    gradient: 'from-primary to-primary/80',
    ringGradient: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--primary)/0.8))'
  },
  fire: {
    primary: 'rgb(239 68 68)',
    secondary: 'rgb(249 115 22)',
    success: 'rgb(251 191 36)',
    warning: 'rgb(245 158 11)',
    danger: 'rgb(220 38 38)',
    gradient: 'from-red-500 to-orange-500',
    ringGradient: 'conic-gradient(from 0deg, rgb(239 68 68), rgb(249 115 22), rgb(251 191 36))'
  },
  ocean: {
    primary: 'rgb(59 130 246)',
    secondary: 'rgb(14 165 233)',
    success: 'rgb(6 182 212)',
    warning: 'rgb(2 132 199)',
    danger: 'rgb(30 58 138)',
    gradient: 'from-blue-500 to-cyan-500',
    ringGradient: 'conic-gradient(from 0deg, rgb(59 130 246), rgb(14 165 233), rgb(6 182 212))'
  },
  forest: {
    primary: 'rgb(34 197 94)',
    secondary: 'rgb(22 163 74)',
    success: 'rgb(134 239 172)',
    warning: 'rgb(74 222 128)',
    danger: 'rgb(21 128 61)',
    gradient: 'from-green-500 to-emerald-500',
    ringGradient: 'conic-gradient(from 0deg, rgb(34 197 94), rgb(22 163 74), rgb(134 239 172))'
  },
  sunset: {
    primary: 'rgb(249 115 22)',
    secondary: 'rgb(251 191 36)',
    success: 'rgb(253 224 71)',
    warning: 'rgb(252 211 77)',
    danger: 'rgb(239 68 68)',
    gradient: 'from-orange-500 to-yellow-400',
    ringGradient: 'conic-gradient(from 0deg, rgb(249 115 22), rgb(251 191 36), rgb(253 224 71))'
  },
  midnight: {
    primary: 'rgb(99 102 241)',
    secondary: 'rgb(124 58 237)',
    success: 'rgb(167 139 250)',
    warning: 'rgb(139 92 246)',
    danger: 'rgb(79 70 229)',
    gradient: 'from-indigo-500 to-purple-600',
    ringGradient: 'conic-gradient(from 0deg, rgb(99 102 241), rgb(124 58 237), rgb(167 139 250))'
  }
}

interface ProgressThemeContextType {
  theme: ProgressTheme
  setTheme: (theme: ProgressTheme) => void
  colors: ThemeColors
}

const ProgressThemeContext = createContext<ProgressThemeContextType | undefined>(undefined)

export function ProgressThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ProgressTheme>('default')

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('progress-theme') as ProgressTheme
    if (savedTheme && themes[savedTheme]) {
      setThemeState(savedTheme)
      updateCSSVariables(savedTheme)
    }
  }, [])

  const setTheme = (newTheme: ProgressTheme) => {
    setThemeState(newTheme)
    localStorage.setItem('progress-theme', newTheme)
    updateCSSVariables(newTheme)
  }

  const updateCSSVariables = (themeName: ProgressTheme) => {
    const root = document.documentElement
    
    // Update CSS variables based on theme
    if (themeName === 'fire') {
      root.style.setProperty('--chart-1', '#ef4444') // red-500
      root.style.setProperty('--chart-2', '#f97316') // orange-500
      root.style.setProperty('--chart-3', '#fbbf24') // amber-400
      root.style.setProperty('--chart-4', '#dc2626') // red-600
    } else if (themeName === 'ocean') {
      root.style.setProperty('--chart-1', '#3b82f6') // blue-500
      root.style.setProperty('--chart-2', '#0ea5e9') // sky-500
      root.style.setProperty('--chart-3', '#06b6d4') // cyan-500
      root.style.setProperty('--chart-4', '#0284c7') // sky-600
    } else if (themeName === 'forest') {
      root.style.setProperty('--chart-1', '#22c55e') // green-500
      root.style.setProperty('--chart-2', '#16a34a') // green-600
      root.style.setProperty('--chart-3', '#86efac') // green-300
      root.style.setProperty('--chart-4', '#4ade80') // green-400
    } else if (themeName === 'sunset') {
      root.style.setProperty('--chart-1', '#f97316') // orange-500
      root.style.setProperty('--chart-2', '#fbbf24') // amber-400
      root.style.setProperty('--chart-3', '#fde047') // yellow-300
      root.style.setProperty('--chart-4', '#f59e0b') // amber-500
    } else if (themeName === 'midnight') {
      root.style.setProperty('--chart-1', '#6366f1') // indigo-500
      root.style.setProperty('--chart-2', '#7c3aed') // violet-600
      root.style.setProperty('--chart-3', '#a78bfa') // violet-400
      root.style.setProperty('--chart-4', '#8b5cf6') // violet-500
    } else {
      // Default theme - keep original oklch values
      root.style.removeProperty('--chart-1')
      root.style.removeProperty('--chart-2')
      root.style.removeProperty('--chart-3')
      root.style.removeProperty('--chart-4')
    }
  }

  return (
    <ProgressThemeContext.Provider value={{
      theme,
      setTheme,
      colors: themes[theme]
    }}>
      {children}
    </ProgressThemeContext.Provider>
  )
}

export function useProgressTheme() {
  const context = useContext(ProgressThemeContext)
  if (!context) {
    throw new Error('useProgressTheme must be used within a ProgressThemeProvider')
  }
  return context
}