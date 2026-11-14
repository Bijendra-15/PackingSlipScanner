import type { CapacitorConfig } from '@capacitor/core'

const config: CapacitorConfig = {
  appId: 'com.packingslipscanner.app',
  appName: 'Packing Slip Scanner',
  webDir: 'dist',
  server: {
    // Replace with your live IIS URL in production
    url: process.env.CAPACITOR_APP_URL || 'https://your-iis-domain.com',
    cleartext: false,
    // Allow external requests to backend API
    allowNavigation: ['https://your-iis-domain.com', 'https://*.your-domain.com'],
    // Block other external domains for security
    blockingExternal: true,
  },
  plugins: {
    StatusBar: {
      overlaysWebview: false,
      style: 'dark',
      backgroundColor: '#1e3a5f',
    },
   SplashScreen: {
      showAutomatically: true,
      androidSplashScreenInset: '10px',
    },
    Keyboard: {
      resize: 'body',
      style: 'native',
      resizeOnOrientationChange: true,
    },
  },
  android: {
    // Optimize for webview performance
    webContentsDebuggingEnabled: __DEV__,
  },
  ios: {
    contentInset: 'always',
    // Enable content sharing for better webview performance
    allowsInlineMediaPlayback: true,
  },
}

export default config