# Packing Slip Scanner - Android WebView App

A native Android application that wraps your IIS-hosted Packing Slip Scanner web app in a WebView.

## Quick Start

1. **Set your IIS URL** in `AndroidApp/app/build.gradle`:
   ```gradle
   buildConfigField "String", "WEB_APP_URL", "\"https://your-iis-domain.com\""
   ```

2. **Build the APK**:
   ```bash
   cd AndroidApp
   ./gradlew assembleDebug
   ```
   APK: `AndroidApp/app/build/outputs/apk/debug/app-debug.apk`

3. **Install on device**:
   ```bash
   adb install AndroidApp/app/build/outputs/apk/debug/app-debug.apk
   ```

## GitHub Actions

The `build-apk-native.yml` workflow builds the APK automatically. Enable it in the Actions tab on GitHub.

## Features

- Native Android WebView with optimized settings
- Loading progress bar
- Error recovery with auto-retry (3 attempts)
- Security: blocks external domain navigation
- Hardware acceleration for performance
- Portrait orientation lock
- Camera/microphone permissions for barcode scanning