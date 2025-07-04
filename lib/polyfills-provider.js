// Polyfills provider for webpack ProvidePlugin
// This file provides browser globals for server-side rendering

// Create a safe self reference that works in both environments
const globalSelf = (() => {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  // Fallback to empty object
  return {};
})();

// Export self for webpack ProvidePlugin
module.exports = {
  self: globalSelf,
};