import { useEffect, useRef, useState, useCallback } from 'react'

interface WebViewProps {
  url: string
  className?: string
}

/**
 * Optimized WebView component with:
 * - Loading state with progress
 * - Error handling with retry
 * - Navigation interception for external links
 * - Performance optimizations
 */
export default function WebView({ url, className = '' }: WebViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loadProgress, setLoadProgress] = useState(0)
  const retryCountRef = useRef(0)
  const MAX_RETRIES = 3

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    setLoadProgress(100)
    // Notify parent that app is ready
    window.parent.postMessage({ type: 'APP_READY' }, '*')
  }, [])

  const handleError = useCallback(() => {
    if (retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current++
      // Auto-retry after a short delay
      setTimeout(() => {
        setHasError(false)
        setIsLoading(true)
        if (iframeRef.current) {
          iframeRef.current.src = url
        }
      }, 2000)
    } else {
      setHasError(true)
      setErrorMessage(`Failed to load ${url}. Please check your connection.`)
      setIsLoading(false)
    }
  }, [url])

  // Simulate progress for better UX
  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return prev
        }
        return prev + Math.random() * 10 + 5
      })
    }, 300)

    return () => clearInterval(interval)
  }, [isLoading])

  // Reset state when URL changes
  useEffect(() => {
    setIsLoading(true)
    setHasError(false)
    setLoadProgress(0)
    retryCountRef.current = 0
  }, [url])

  const handleRetry = useCallback(() => {
    retryCountRef.current = 0
    setHasError(false)
    setIsLoading(true)
    setLoadProgress(0)
    if (iframeRef.current) {
      iframeRef.current.src = url
    }
  }, [url])

  return (
    <div className={`relative w-full h-screen overflow-hidden ${className}`}>
      {/* Loading Progress Bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
      )}

      {/* Loading Spinner Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-4 text-sm text-gray-600">Loading Packing Slip Scanner...</p>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gray-50 p-6">
          <div className="w-16 h-16 mb-4 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Connection Error</h3>
          <p className="text-sm text-gray-600 text-center mb-6">{errorMessage}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* WebView Iframe - using sandbox for security but allowing necessary features */}
      <iframe
        ref={iframeRef}
        src={url}
        className="absolute inset-0 w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-orientation-lock allow-camera allow-microphone"
        allow="camera; microphone; geolocation; clipboard-write; accelerometer; gyroscope"
        title="Packing Slip Scanner"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}