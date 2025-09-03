import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/home',
        destination: '/home/landing',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
