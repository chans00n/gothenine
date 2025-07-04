// Global polyfills for server-side rendering
if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis as any
}

if (typeof global !== 'undefined' && typeof (global as any).self === 'undefined') {
  ;(global as any).self = global
}

// Polyfill window and document for server
if (typeof window === 'undefined') {
  ;(global as any).window = {}
  ;(global as any).document = {}
  ;(global as any).navigator = { userAgent: '' }
}

export {} 