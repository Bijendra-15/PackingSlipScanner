# GitHub Actions

This project uses GitHub Actions to automate builds. The following workflows are available:

## Available Workflows

### Build Android APK
- **File**: `.github/workflows/build-apk.yml`
- **Trigger**: Push to `master`/`main`, tags (`v*`), or manual dispatch
- **Output**: Android APK artifact (and release on tags)

### Build iOS IPA
- **File**: `.github/workflows/build-ipa.yml`
- **Trigger**: Push to `master`/`main`, tags (`v*`), or manual dispatch
- **Output**: iOS IPA artifact (and release on tags)

### Deploy to GitHub Pages
- **File**: `.github/workflows/deploy-pages.yml`
- **Trigger**: Push to `master`/`main`, or manual dispatch
- **Output**: Web app deployed to GitHub Pages

### Test Build
- **File**: `.github/workflows/test-build.yml`
- **Trigger**: Pull requests
- **Output**: Build verification

## Enabling Workflows

1. Go to your repository **Actions** tab
2. You should see the workflows listed as "inactive"
3. Click on a workflow and select **Enable workflow** (or **Run workflow** for manual trigger)

## Manual Build

To build manually:
1. Go to **Actions** tab
2. Select the workflow (e.g., "Build Android APK")
3. Click **Run workflow** button
4. Choose branch and click **Run workflow**

## Releasing

To create a release with APK/IPA:
1. Create a tag: `git tag v1.0.0 && git push origin v1.0.0`
2. The workflow will automatically build and attach the artifact to a GitHub Release

## Required Secrets

For iOS builds, set the following repository secrets:
- `TEAM_ID`: Your Apple Developer Team ID
- `MATCH_PASSWORD`: Fastlane match password (if using match)
- `APP_STORE_CONNECT_API_KEY`: For App Store distribution (optional)

For Android builds, no secrets are required for debug builds.