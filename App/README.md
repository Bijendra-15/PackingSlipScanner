# Packing Slip Scanner Mobile App

A Capacitor-based mobile application wrapper for the Packing Slip Scanner web application. The app loads the web application via an optimized WebView, providing a native mobile experience with splash screens, status bar integration, and offline-capable caching.

## Features

- **Optimized WebView** - Fast-loading iframe with progress indicator and error handling
- **Native Splash Screen** - Animated splash with logo
- **Status Bar Integration** - Configurable status bar color matching the app theme
- **Security Hardened** - Sandbox restrictions, external domain blocking
- **Performance Optimized** - Code splitting, minified builds, chunk optimization
- **Error Recovery** - Automatic retry with exponential backoff
- **Responsive Design** - Handles orientation changes and viewport variations

## Prerequisites

- Node.js 18+ and npm/yarn
- Android Studio (for Android builds) or Xcode (for iOS builds)
- Capacitor CLI

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build the web app
npm run build

# 3. Initialize Capacitor (run once)
npx cap init

# 4. Sync platforms
npx cap sync

# 5. Run on device
npx cap run android
npx cap run ios
```

## Configuration

Edit `capacitor.config.ts` to configure:

- **`server.url`** - Your IIS website URL
- **`server.allowNavigation`** - Additional allowed domains
- **`plugins.StatusBar`** - Status bar appearance
- **`plugins.SplashScreen`** - Splash screen settings

## Production Build

```bash
# Build for production
npm run build

# Sync with Capacitor
npx cap sync

# Build APK
npx cap build android

# Build for iOS
npx cap build ios
```

## Environment Variables

Set `VITE_WEB_APP_URL` in a `.env` file to override the default URL:

```
VITE_WEB_APP_URL=https://your-iis-domain.com
```

## Project Structure

```
App/
├── public/
│   ├── icons/          # App icons
│   ├── manifest.json   # PWA manifest
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── WebView.tsx   # WebView component
│   │   └── Splash.tsx    # Splash screen
│   └── main.tsx          # App entry point
├── capacitor.config.ts   # Capacitor configuration
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## License

Private