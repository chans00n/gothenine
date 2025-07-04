"use client"

import { useEffect } from 'react'
import { getAccessibilityAuditor } from '@/lib/utils/accessibility'

export function AccessibilityTest() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Run accessibility audit after page load
      const timer = setTimeout(() => {
        getAccessibilityAuditor().auditPage()
      }, 2000)

      // Add global accessibility testing utilities
      ;(window as any).__75hardA11y__ = {
        audit: () => getAccessibilityAuditor().auditPage(),
        getIssues: () => getAccessibilityAuditor().getIssues(),
        clearIssues: () => getAccessibilityAuditor().clearIssues(),
      }

      console.log('♿ Accessibility testing available at window.__75hardA11y__')

      return () => clearTimeout(timer)
    }
  }, [])

  return null
}