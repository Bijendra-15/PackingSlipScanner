import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import WebView from './components/WebView'
import Splash from './components/Splash'

// Configure your IIS URL here - set via environment variable or edit directly
const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL || 'https://your-iis-domain.com'

function AppContent() {
  const [showSplash, setShowSplash] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const location = useLocation()

  // Hide splash screen once the webview is ready
  const handleSplashComplete = useCallback(() => {
    setShowSplash(false)
  }, [])

  // Listen for messages from the web app (e.g., navigation events)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data?.type === 'APP_READY') {
          setIsReady(true)
        }
      } catch {
        // Ignore non-JSON messages
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (showSplash) {
    return <Splash onComplete={handleSplashComplete} />
  }

  return (
    <Routes>
      <Route path="/*" element={<WebView url={WEB_APP_URL} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}