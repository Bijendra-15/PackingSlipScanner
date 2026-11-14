# iOS Build Script
# Requires macOS and Xcode

# Build the web app
cd ../..
npm run build
cd App

# Sync with Capacitor
npx cap sync ios

# Open in Xcode
npx cap open ios

# Build in Xcode:
# 1. Select your device/target
# 2. Choose Generic iOS Device
# 3. Product > Archive
# 4. Distribute App > Development
# 5. Export to IPA