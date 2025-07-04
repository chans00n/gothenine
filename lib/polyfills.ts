// Global polyfills for server-side rendering
// This file is imported at the top of the root layout to ensure polyfills are applied early

// Create a universal global reference
const getGlobalObject = () => {
  if (typeof globalThis !== 'undefined') return globalThis
  if (typeof self !== 'undefined') return self
  if (typeof window !== 'undefined') return window
  if (typeof global !== 'undefined') return global
  throw new Error('Unable to locate global object')
}

// Apply polyfills only on the server
if (typeof window === 'undefined') {
  const globalObj = getGlobalObject() as any
  
  // Polyfill self
  if (typeof globalObj.self === 'undefined') {
    globalObj.self = globalObj
  }
  
  // Polyfill minimal window object for libraries that check for its existence
  if (typeof globalObj.window === 'undefined') {
    globalObj.window = {
      // Add minimal properties that libraries might check
      location: { href: '', protocol: 'https:', host: 'localhost' },
      navigator: { userAgent: 'node' },
      document: {
        createElement: () => ({
          appendChild: () => {},
          removeChild: () => {},
          setAttribute: () => {},
          style: {},
        }),
        createTextNode: () => ({}),
        querySelector: () => null,
        querySelectorAll: () => [],
        getElementsByTagName: () => [],
        getElementById: () => null,
        getElementsByClassName: () => [],
        body: {
          appendChild: () => {},
          removeChild: () => {},
        },
        head: {
          appendChild: () => {},
          removeChild: () => {},
        },
      },
    }
  }
  
  // Ensure document exists
  if (typeof globalObj.document === 'undefined') {
    globalObj.document = globalObj.window.document
  }
  
  // Ensure navigator exists
  if (typeof globalObj.navigator === 'undefined') {
    globalObj.navigator = globalObj.window.navigator
  }
}

export {} 