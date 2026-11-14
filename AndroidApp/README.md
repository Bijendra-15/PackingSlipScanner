# Android WebView App - Packing Slip Scanner

Native Android application that wraps your IIS website in a WebView.

## Features

- **Native Android WebView** - Full Android app with WebView
- **Loading Progress** - Visual progress indicator
- **Error Recovery** - Auto-retry with backoff (3 attempts)
- **Security** - Blocks external domain navigation
- **Optimized Performance** - Hardware acceleration, caching
- **Portrait Orientation** - Locks to portrait mode

## Quick Start

### 1. Set Your IIS URL

Edit `AndroidApp/app/build.gradle`:
```gradle
buildConfigField "String", "WEB_APP_URL", "\"https://your-iis-domain.com\""
```

### 2. Build with Android Studio

1. Open Android Studio
2. Select "Open an Existing Android Studio Project"
3. Choose the `AndroidApp` folder
4. Build & Run (green play button)

### 3. Build via Command Line

```bash
cd AndroidApp
./gradlew assembleDebug
```

APK location: `AndroidApp/app/build/outputs/apk/debug/app-debug.apk`

## Project Structure

```
AndroidApp/
├── app/
│   ├── build.gradle
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/packingslipscanner/app/
│       │   ├── MainActivity.kt
│       │   └── BaseWebViewActivity.kt
│       └── res/
│           ├── layout/activity_main.xml
│           ├── values/strings.xml, colors.xml, themes.xml, dimens.xml
│           └── drawable/button_background.xml, ic_error_circle.xml
├── build.gradle
├── settings.gradle
└── gradle.properties
```

## Requirements

- Android SDK 34
- Java 17
- Kotlin 1.9.20
- Android Studio Hedgehog or newer
- Minimum SDK: Android 5.0 (API 21)

## GitHub Actions

The `.github/workflows/build-apk-native.yml` workflow builds the APK automatically on push to master/main or when you create a tag.

To enable:
1. Go to Actions tab on GitHub
2. Find "Build Android APK" workflow
3. Click "Enable workflow"

To build manually:
1. Go to Actions tab
2. Click "Run workflow" on the workflow card
3. APK will be available as an artifact