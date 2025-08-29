import React, { lazy, Suspense } from 'react'

// Lazy load Three.js components to reduce initial bundle size
const FuturisticBackground = lazy(() => import('./FuturisticBackground'))
const ThreeBackground = lazy(() => import('./ThreeBackground'))

const ThreeLoadingFallback = () => (
  <div className="fixed inset-0 -z-10 bg-black">
    <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-50"></div>
  </div>
)

export const LazyFuturisticBackground = () => (
  <Suspense fallback={<ThreeLoadingFallback />}>
    <FuturisticBackground />
  </Suspense>
)

export const LazyThreeBackground = () => (
  <Suspense fallback={<ThreeLoadingFallback />}>
    <ThreeBackground />
  </Suspense>
)
