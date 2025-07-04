// Device and browser detection utilities for testing

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown'
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown'
  version: string
  isStandalone: boolean
  supportsPWA: boolean
  supportsNotifications: boolean
  supportsServiceWorker: boolean
  screenSize: { width: number; height: number }
  pixelRatio: number
  isOnline: boolean
  connectionType?: string
}

export class DeviceTester {
  private static instance: DeviceTester
  
  static getInstance(): DeviceTester {
    if (!DeviceTester.instance) {
      DeviceTester.instance = new DeviceTester()
    }
    return DeviceTester.instance
  }

  getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return this.getServerSideDefaults()
    }

    const userAgent = navigator.userAgent
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true

    return {
      type: this.getDeviceType(),
      os: this.getOS(userAgent),
      browser: this.getBrowser(userAgent),
      version: this.getBrowserVersion(userAgent),
      isStandalone,
      supportsPWA: this.checkPWASupport(),
      supportsNotifications: 'Notification' in window,
      supportsServiceWorker: 'serviceWorker' in navigator,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      pixelRatio: window.devicePixelRatio || 1,
      isOnline: navigator.onLine,
      connectionType: this.getConnectionType()
    }
  }

  private getServerSideDefaults(): DeviceInfo {
    return {
      type: 'desktop',
      os: 'unknown',
      browser: 'unknown',
      version: '',
      isStandalone: false,
      supportsPWA: false,
      supportsNotifications: false,
      supportsServiceWorker: false,
      screenSize: { width: 1920, height: 1080 },
      pixelRatio: 1,
      isOnline: true
    }
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth
    const userAgent = navigator.userAgent

    // Check for mobile devices
    if (/Mobi|Android/i.test(userAgent) || width < 768) {
      return 'mobile'
    }
    
    // Check for tablets
    if (/Tablet|iPad/i.test(userAgent) || (width >= 768 && width < 1024)) {
      return 'tablet'
    }
    
    return 'desktop'
  }

  private getOS(userAgent: string): DeviceInfo['os'] {
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios'
    if (/Android/i.test(userAgent)) return 'android'
    if (/Windows/i.test(userAgent)) return 'windows'
    if (/Mac/i.test(userAgent)) return 'macos'
    if (/Linux/i.test(userAgent)) return 'linux'
    return 'unknown'
  }

  private getBrowser(userAgent: string): DeviceInfo['browser'] {
    if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) return 'chrome'
    if (/Firefox/i.test(userAgent)) return 'firefox'
    if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'safari'
    if (/Edge/i.test(userAgent)) return 'edge'
    if (/Opera/i.test(userAgent)) return 'opera'
    return 'unknown'
  }

  private getBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+\.\d+)/i)
    return match ? match[2] : ''
  }

  private checkPWASupport(): boolean {
    return 'serviceWorker' in navigator && 
           'Notification' in window && 
           'PushManager' in window
  }

  private getConnectionType(): string | undefined {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection
    return connection?.effectiveType
  }

  // Test PWA functionality
  testPWAFeatures(): Record<string, boolean> {
    if (typeof window === 'undefined') return {}

    return {
      serviceWorker: 'serviceWorker' in navigator,
      notifications: 'Notification' in window,
      pushManager: 'PushManager' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      webShare: 'share' in navigator,
      installPrompt: 'BeforeInstallPromptEvent' in window,
      manifest: 'manifest' in document.head,
      cacheAPI: 'caches' in window,
      indexedDB: 'indexedDB' in window,
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test')
          localStorage.removeItem('test')
          return true
        } catch {
          return false
        }
      })(),
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      vibration: 'vibrate' in navigator,
    }
  }

  // Test responsive design breakpoints
  testBreakpoints(): Record<string, boolean> {
    if (typeof window === 'undefined') return {}

    const width = window.innerWidth
    return {
      mobile: width < 768,
      tablet: width >= 768 && width < 1024,
      desktop: width >= 1024,
      largeDesktop: width >= 1440,
    }
  }

  // Test network conditions
  testNetworkConditions(): Record<string, any> {
    if (typeof window === 'undefined') return {}

    const connection = (navigator as any).connection
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
    }
  }

  // Generate test report
  generateTestReport(): Record<string, any> {
    return {
      device: this.getDeviceInfo(),
      pwaFeatures: this.testPWAFeatures(),
      breakpoints: this.testBreakpoints(),
      network: this.testNetworkConditions(),
      timestamp: new Date().toISOString(),
    }
  }

  // Log test report to console
  logTestReport(): void {
    const report = this.generateTestReport()
    
    console.group('📱 Cross-Device Test Report')
    console.log('Device Info:', report.device)
    console.log('PWA Features:', report.pwaFeatures)
    console.log('Breakpoints:', report.breakpoints)
    console.log('Network:', report.network)
    console.groupEnd()
  }

  // Check for common issues
  checkCommonIssues(): Array<{ type: string; message: string; severity: 'error' | 'warning' }> {
    const issues: Array<{ type: string; message: string; severity: 'error' | 'warning' }> = []
    const device = this.getDeviceInfo()
    const features = this.testPWAFeatures()

    // Check iOS Safari issues
    if (device.os === 'ios' && device.browser === 'safari') {
      if (!device.isStandalone && device.supportsPWA) {
        issues.push({
          type: 'ios-pwa',
          message: 'iOS Safari: Test PWA installation and functionality',
          severity: 'warning'
        })
      }
    }

    // Check service worker support
    if (!features.serviceWorker) {
      issues.push({
        type: 'no-service-worker',
        message: 'Service Worker not supported - offline functionality unavailable',
        severity: 'error'
      })
    }

    // Check notification support
    if (!features.notifications) {
      issues.push({
        type: 'no-notifications',
        message: 'Notifications not supported',
        severity: 'warning'
      })
    }

    // Check small screen issues
    if (device.type === 'mobile' && device.screenSize.width < 375) {
      issues.push({
        type: 'small-screen',
        message: 'Very small screen detected - check layout on narrow devices',
        severity: 'warning'
      })
    }

    // Check network conditions
    const network = this.testNetworkConditions()
    if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
      issues.push({
        type: 'slow-network',
        message: 'Slow network detected - optimize for low bandwidth',
        severity: 'warning'
      })
    }

    return issues
  }
}

// Export lazy singleton getter to avoid SSR issues
export const getDeviceTester = () => {
  if (typeof window === 'undefined') {
    throw new Error('DeviceTester can only be used in the browser')
  }
  return DeviceTester.getInstance()
}

// React hook for device testing
export function useDeviceTesting() {
  const getDeviceInfo = () => getDeviceTester().getDeviceInfo()
  const testPWAFeatures = () => getDeviceTester().testPWAFeatures()
  const generateReport = () => getDeviceTester().generateTestReport()
  const checkIssues = () => getDeviceTester().checkCommonIssues()

  return {
    getDeviceInfo,
    testPWAFeatures,
    generateReport,
    checkIssues,
  }
}