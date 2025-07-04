const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: true, // Disable PWA for testing
  buildExcludes: [/middleware-manifest.json$/],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'framer-motion'],
  },
  
  // Bundle optimization
  webpack: (config, { isServer }) => {
    // Fix browser-specific library SSR issues
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('framer-motion')
      config.externals.push('@tiptap/react')
      config.externals.push('@tiptap/starter-kit') 
      config.externals.push('@tiptap/extension-placeholder')
      config.externals.push('embla-carousel-react')
      
      // Fix 'self is not defined' error in server builds
      config.output = config.output || {}
      config.output.globalObject = 'this'
    }
    
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

module.exports = withPWA(nextConfig)