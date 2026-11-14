# Android Build Script
# Run this in Android Studio or via command line

# Build the web app
cd ../..
npm run build
cd App

# Sync with Capacitor
npx cap sync android

# Build APK
npx cap build android --release

# Output: App/app/build/outputs/apk/release/app-release-unsigned.apk