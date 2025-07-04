"use client"

import { useProgressTheme, type ProgressTheme } from '@/lib/contexts/progress-theme'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { Palette } from 'lucide-react'

const themeDescriptions: Record<ProgressTheme, { name: string; description: string }> = {
  default: {
    name: 'Default',
    description: 'Classic theme with system colors'
  },
  fire: {
    name: 'Fire',
    description: 'Energetic reds and oranges'
  },
  ocean: {
    name: 'Ocean',
    description: 'Calming blues and cyans'
  },
  forest: {
    name: 'Forest',
    description: 'Natural greens and emeralds'
  },
  sunset: {
    name: 'Sunset',
    description: 'Warm oranges and yellows'
  },
  midnight: {
    name: 'Midnight',
    description: 'Deep indigos and purples'
  }
}

export function ThemeSelector() {
  const { theme, setTheme, colors } = useProgressTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Progress Theme
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={theme} onValueChange={(value) => setTheme(value as ProgressTheme)}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(themeDescriptions) as ProgressTheme[]).map((themeKey) => {
              const { name, description } = themeDescriptions[themeKey]
              const isSelected = theme === themeKey
              
              return (
                <motion.div
                  key={themeKey}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Label
                    htmlFor={themeKey}
                    className={`
                      flex cursor-pointer rounded-lg border-2 p-4 transition-colors
                      ${isSelected ? 'border-primary' : 'border-muted hover:border-muted-foreground/50'}
                    `}
                  >
                    <RadioGroupItem value={themeKey} id={themeKey} className="sr-only" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{name}</span>
                        <ThemePreview theme={themeKey} />
                      </div>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                  </Label>
                </motion.div>
              )
            })}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

function ThemePreview({ theme }: { theme: ProgressTheme }) {
  const colors = themes[theme]
  
  return (
    <div className="flex gap-1">
      <div
        className="h-6 w-6 rounded-full"
        style={{ background: colors.primary }}
      />
      <div
        className="h-6 w-6 rounded-full"
        style={{ background: colors.secondary }}
      />
      <div
        className="h-6 w-6 rounded-full"
        style={{ background: colors.success }}
      />
    </div>
  )
}

const themes: Record<ProgressTheme, { primary: string; secondary: string; success: string }> = {
  default: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    success: 'rgb(34 197 94)'
  },
  fire: {
    primary: 'rgb(239 68 68)',
    secondary: 'rgb(249 115 22)',
    success: 'rgb(251 191 36)'
  },
  ocean: {
    primary: 'rgb(59 130 246)',
    secondary: 'rgb(14 165 233)',
    success: 'rgb(6 182 212)'
  },
  forest: {
    primary: 'rgb(34 197 94)',
    secondary: 'rgb(22 163 74)',
    success: 'rgb(134 239 172)'
  },
  sunset: {
    primary: 'rgb(249 115 22)',
    secondary: 'rgb(251 191 36)',
    success: 'rgb(253 224 71)'
  },
  midnight: {
    primary: 'rgb(99 102 241)',
    secondary: 'rgb(124 58 237)',
    success: 'rgb(167 139 250)'
  }
}