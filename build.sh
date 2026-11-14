#!/usr/bin/env bash
# Build script for Packing Slip Scanner App
# This script builds the web app and syncs with Capacitor

set -e

echo "========================================="
echo "Building Packing Slip Scanner App"
echo "========================================="

# Step 1: Install dependencies
echo "Installing dependencies..."
npm install

# Step 2: Build the web app
echo "Building web app..."
npm run build

# Step 3: Sync with Capacitor
echo "Syncing with Capacitor..."
npx cap sync

echo "Build complete!"
echo ""
echo "To run on a device:"
echo "  npx cap run android"
echo "  npx cap run ios"