"use client"

import { useEffect } from 'react'
import { deviceTester } from '@/lib/utils/device-testing'

export function DeviceTest() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Run device compatibility tests
      setTimeout(() => {
        deviceTester.logTestReport()
        
        const issues = deviceTester.checkCommonIssues()
        if (issues.length > 0) {
          console.group('🚨 Device Compatibility Issues')
          issues.forEach(issue => {
            if (issue.severity === 'error') {
              console.error(issue.message)
            } else {
              console.warn(issue.message)
            }
          })
          console.groupEnd()
        }
      }, 1000)

      // Add global device testing utilities
      ;(window as any).__75hardDevice__ = {
        getInfo: () => deviceTester.getDeviceInfo(),
        testPWA: () => deviceTester.testPWAFeatures(),
        testBreakpoints: () => deviceTester.testBreakpoints(),
        generateReport: () => deviceTester.generateTestReport(),
        checkIssues: () => deviceTester.checkCommonIssues(),
      }

      console.log('📱 Device testing available at window.__75hardDevice__')
    }
  }, [])

  return null
}