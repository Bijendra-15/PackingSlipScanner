import { useEffect, useState } from 'react'

interface SplashProps {
  onComplete: () => void
}

/**
 * Splash screen with logo animation
 * Auto-dismisses after minimum display time
 */
export default function Splash({ onComplete }: SplashProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      // Wait for fade animation to complete before calling onComplete
      setTimeout(onComplete, 300)
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-blue-800 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Logo */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
          <svg
            className="w-14 h-14 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>

      {/* App Name */}
      <h1 className="text-3xl font-bold text-white mb-2">Packing Slip Scanner</h1>
      <p className="text-blue-200 text-sm">Powered by Capacitor</p>

      {/* Loading indicator */}
      <div className="absolute bottom-12">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  )
}