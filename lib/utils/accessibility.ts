// Accessibility utilities and audit functions

export class AccessibilityAuditor {
  private static instance: AccessibilityAuditor
  private issues: Array<{
    type: string
    element: Element
    message: string
    severity: 'error' | 'warning' | 'info'
  }> = []

  static getInstance(): AccessibilityAuditor {
    if (!AccessibilityAuditor.instance) {
      AccessibilityAuditor.instance = new AccessibilityAuditor()
    }
    return AccessibilityAuditor.instance
  }

  // Run comprehensive accessibility audit
  auditPage(): void {
    if (typeof window === 'undefined') return

    this.issues = []
    
    this.checkImages()
    this.checkButtons()
    this.checkForms()
    this.checkHeadings()
    this.checkColorContrast()
    this.checkKeyboardNavigation()
    this.checkARIA()
    this.checkSemanticHTML()

    this.reportIssues()
  }

  private checkImages(): void {
    const images = document.querySelectorAll('img')
    images.forEach((img) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        this.issues.push({
          type: 'missing-alt',
          element: img,
          message: 'Image missing alt text',
          severity: 'error'
        })
      }
      
      if (img.alt === '') {
        // Empty alt is okay for decorative images, but check if it should be decorative
        const parent = img.closest('button, a')
        if (parent) {
          this.issues.push({
            type: 'empty-alt-in-interactive',
            element: img,
            message: 'Decorative image inside interactive element may need descriptive alt text',
            severity: 'warning'
          })
        }
      }
    })
  }

  private checkButtons(): void {
    const buttons = document.querySelectorAll('button, [role="button"]')
    buttons.forEach((button) => {
      const text = this.getAccessibleText(button)
      if (!text) {
        this.issues.push({
          type: 'button-no-text',
          element: button,
          message: 'Button has no accessible text',
          severity: 'error'
        })
      }

      // Check for disabled buttons without proper indication
      const isDisabled = button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true'
      if (isDisabled && !button.getAttribute('aria-describedby')) {
        this.issues.push({
          type: 'disabled-no-description',
          element: button,
          message: 'Disabled button should explain why it\'s disabled',
          severity: 'warning'
        })
      }
    })
  }

  private checkForms(): void {
    const inputs = document.querySelectorAll('input, textarea, select')
    inputs.forEach((input) => {
      const label = this.getLabel(input)
      if (!label && input.type !== 'hidden' && input.type !== 'submit') {
        this.issues.push({
          type: 'input-no-label',
          element: input,
          message: 'Form control missing label',
          severity: 'error'
        })
      }

      // Check for required fields
      if (input.hasAttribute('required') && !input.getAttribute('aria-describedby')) {
        this.issues.push({
          type: 'required-no-description',
          element: input,
          message: 'Required field should indicate it\'s required',
          severity: 'warning'
        })
      }
    })
  }

  private checkHeadings(): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let currentLevel = 0
    
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1))
      
      if (level > currentLevel + 1) {
        this.issues.push({
          type: 'heading-skip',
          element: heading,
          message: `Heading level skipped (h${currentLevel} to h${level})`,
          severity: 'warning'
        })
      }
      
      currentLevel = Math.max(currentLevel, level)
    })

    // Check for h1
    const h1Count = document.querySelectorAll('h1').length
    if (h1Count === 0) {
      this.issues.push({
        type: 'no-h1',
        element: document.body,
        message: 'Page missing h1 heading',
        severity: 'warning'
      })
    } else if (h1Count > 1) {
      this.issues.push({
        type: 'multiple-h1',
        element: document.body,
        message: 'Page has multiple h1 headings',
        severity: 'warning'
      })
    }
  }

  private checkColorContrast(): void {
    // Basic color contrast check (simplified)
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button')
    
    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element)
      const textColor = styles.color
      const backgroundColor = styles.backgroundColor
      
      // Skip if transparent background or no text
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || !element.textContent?.trim()) {
        return
      }

      // This is a simplified check - in production, use a proper contrast ratio calculator
      const contrast = this.getContrastRatio(textColor, backgroundColor)
      if (contrast < 4.5) {
        this.issues.push({
          type: 'low-contrast',
          element: element,
          message: `Low color contrast ratio: ${contrast.toFixed(2)}`,
          severity: 'warning'
        })
      }
    })
  }

  private checkKeyboardNavigation(): void {
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )

    focusableElements.forEach((element) => {
      const tabIndex = element.getAttribute('tabindex')
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.issues.push({
          type: 'positive-tabindex',
          element: element,
          message: 'Avoid positive tabindex values',
          severity: 'warning'
        })
      }

      // Check for focus indicators
      const styles = window.getComputedStyle(element, ':focus')
      if (styles.outline === 'none' && !styles.boxShadow && !styles.border) {
        this.issues.push({
          type: 'no-focus-indicator',
          element: element,
          message: 'Interactive element missing focus indicator',
          severity: 'error'
        })
      }
    })
  }

  private checkARIA(): void {
    // Get all elements and filter for those with ARIA attributes
    const allElements = document.querySelectorAll('*')
    const elementsWithARIA = Array.from(allElements).filter(element => 
      Array.from(element.attributes).some(attr => attr.name.startsWith('aria-'))
    )
    
    elementsWithARIA.forEach((element) => {
      // Check for valid ARIA attributes
      const ariaAttributes = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('aria-'))
      
      ariaAttributes.forEach((attr) => {
        const value = attr.value
        
        // Check for empty ARIA labels
        if ((attr.name === 'aria-label' || attr.name === 'aria-labelledby') && !value.trim()) {
          this.issues.push({
            type: 'empty-aria-label',
            element: element,
            message: `Empty ${attr.name} attribute`,
            severity: 'error'
          })
        }
      })

      // Check for elements that reference non-existent IDs
      const labelledBy = element.getAttribute('aria-labelledby')
      const describedBy = element.getAttribute('aria-describedby')
      
      if (labelledBy && !document.getElementById(labelledBy)) {
        this.issues.push({
          type: 'invalid-aria-reference',
          element: element,
          message: `aria-labelledby references non-existent ID: ${labelledBy}`,
          severity: 'error'
        })
      }
      
      if (describedBy && !document.getElementById(describedBy)) {
        this.issues.push({
          type: 'invalid-aria-reference',
          element: element,
          message: `aria-describedby references non-existent ID: ${describedBy}`,
          severity: 'error'
        })
      }
    })
  }

  private checkSemanticHTML(): void {
    // Check for proper use of semantic elements
    const genericContainers = document.querySelectorAll('div, span')
    
    genericContainers.forEach((element) => {
      const role = element.getAttribute('role')
      const hasClickHandler = element.hasAttribute('onclick') || 
        element.addEventListener?.length > 0
      
      if (hasClickHandler && !role) {
        this.issues.push({
          type: 'clickable-div',
          element: element,
          message: 'Interactive div should use button element or proper role',
          severity: 'warning'
        })
      }
    })
  }

  private getAccessibleText(element: Element): string {
    return element.getAttribute('aria-label') ||
           element.getAttribute('aria-labelledby') ||
           element.textContent?.trim() ||
           ''
  }

  private getLabel(input: Element): string | null {
    const id = input.getAttribute('id')
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`)
      if (label) return label.textContent?.trim() || null
    }
    
    const ariaLabel = input.getAttribute('aria-label')
    if (ariaLabel) return ariaLabel
    
    const ariaLabelledBy = input.getAttribute('aria-labelledby')
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy)
      return labelElement?.textContent?.trim() || null
    }
    
    return null
  }

  private getContrastRatio(color1: string, color2: string): number {
    // Simplified contrast ratio calculation
    // In production, use a proper color contrast library
    return 4.5 // Placeholder
  }

  private reportIssues(): void {
    if (this.issues.length === 0) {
      console.log('✅ No accessibility issues found!')
      return
    }

    console.group('🔍 Accessibility Audit Results')
    
    const errors = this.issues.filter(issue => issue.severity === 'error')
    const warnings = this.issues.filter(issue => issue.severity === 'warning')
    
    if (errors.length > 0) {
      console.group(`❌ ${errors.length} Error(s)`)
      errors.forEach(issue => {
        console.error(issue.message, issue.element)
      })
      console.groupEnd()
    }
    
    if (warnings.length > 0) {
      console.group(`⚠️ ${warnings.length} Warning(s)`)
      warnings.forEach(issue => {
        console.warn(issue.message, issue.element)
      })
      console.groupEnd()
    }
    
    console.groupEnd()
  }

  getIssues() {
    return this.issues
  }

  clearIssues() {
    this.issues = []
  }
}

// Export singleton instance
export const accessibilityAuditor = AccessibilityAuditor.getInstance()

// Keyboard navigation utilities
export const KeyboardNavigation = {
  // Trap focus within an element
  trapFocus(element: Element) {
    const focusableElements = element.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) return
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }
    
    element.addEventListener('keydown', handleKeyDown)
    firstElement.focus()
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  },

  // Announce content to screen readers
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.textContent = message
    
    document.body.appendChild(announcer)
    
    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  }
}

// Screen reader only styles
export const srOnlyStyles = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0'
}