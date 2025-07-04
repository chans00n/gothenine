"use client"

import { useEffect } from 'react'
import { accessibilityAuditor } from '@/lib/utils/accessibility'

export function AccessibilityTest() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Run accessibility audit after page load
      const timer = setTimeout(() => {
        accessibilityAuditor.auditPage()
      }, 2000)

      // Add global accessibility testing utilities
      ;(window as any).__75hardA11y__ = {
        audit: () => accessibilityAuditor.auditPage(),
        getIssues: () => accessibilityAuditor.getIssues(),
        clearIssues: () => accessibilityAuditor.clearIssues(),
      }

      console.log('♿ Accessibility testing available at window.__75hardA11y__')

      return () => clearTimeout(timer)
    }
  }, [])

  return null
}