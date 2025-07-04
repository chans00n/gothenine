"use client"

import { useEffect } from 'react'
import { getDeviceTester } from '@/lib/utils/device-testing'

export function DeviceTest() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Run device compatibility tests
      setTimeout(() => {
        const deviceTester = getDeviceTester()
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
        getInfo: () => getDeviceTester().getDeviceInfo(),
        testPWA: () => getDeviceTester().testPWAFeatures(),
        testBreakpoints: () => getDeviceTester().testBreakpoints(),
        generateReport: () => getDeviceTester().generateTestReport(),
        checkIssues: () => getDeviceTester().checkCommonIssues(),
      }

      console.log('📱 Device testing available at window.__75hardDevice__')
    }
  }, [])

  return null
}