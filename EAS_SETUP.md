# EAS (Expo Application Services) Setup Guide

## What is EAS?
EAS is Expo's cloud build service that creates native iOS (.ipa) and Android (.apk/.aab) apps without needing Xcode or Android Studio.

## Quick Start Commands

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
# Enter your Expo account credentials
```

### 3. Configure Project (Already Done)
The following files are configured:
- `eas.json` - Build profiles
- `app.json` - Bundle identifiers added

### 4. Build Commands

#### Preview Build (For Testing)
```bash
# iOS Simulator
 eas build --platform ios --profile preview

# Android APK
eas build --platform android --profile preview
```

#### Development Build (With Dev Client)
```bash
eas build --platform ios --profile development
eas build --platform android --profile development
```

#### Production Build (For Stores)
```bash
# Build both platforms
eas build --platform all --profile production

# Or individually
eas build --platform ios --profile production
eas build --platform android --profile production
```

### 5. Submit to Stores

```bash
# Submit iOS to App Store
eas submit --platform ios

# Submit Android to Play Store
eas submit --platform android
```

## Build Profiles Explained

| Profile | Use Case | Output |
|---------|----------|--------|
| `preview` | Testing on simulators/devices | .ipa (sim), .apk |
| `development` | Local development with hot reload | Custom dev client |
| `production` | App Store / Play Store release | .ipa, .aab |

## Project Configuration

### Bundle Identifiers (Set in app.json)
- iOS: `com.yourcompany.gita`
- Android: `com.yourcompany.gita`

**Change these to your unique identifiers before publishing!**

## Credentials Setup

### iOS Credentials
```bash
# Let EAS handle automatically (recommended)
eas credentials:manager

# Or provide manually:
- Apple Developer Account
- Bundle Identifier
- Provisioning Profile
- Distribution Certificate
```

### Android Credentials
```bash
# Let EAS handle automatically (recommended)
eas credentials:manager

# Or provide manually:
- Upload Keystore (for Google Play)
- Or let EAS generate one
```

## Testing Builds

### iOS Simulator
1. Download the .tar.gz from EAS
2. Extract it
3. Open the .app in iOS Simulator
```bash
xcrun simctl install booted /path/to/gita.app
```

### Android Emulator
1. Download the .apk from EAS
2. Install on emulator:
```bash
adb install /path/to/gita.apk
```

### Physical Devices
- iOS: Use TestFlight (requires App Store Connect)
- Android: Install .apk directly or use internal testing track

## OTA Updates (Over-The-Air)

Push JS updates without app store review:
```bash
eas update --branch preview --message "Fixed onboarding bug"
```

Users get updates automatically when they open the app.

## Cost

| Service | Free Tier | Paid |
|---------|-----------|------|
| EAS Build | 30 builds/month | $29/build after |
| EAS Submit | 30 submissions/month | $5/submit after |
| EAS Update | 1M requests/month | $0.10/1K after |
| Hosting | 100GB/month | $0.20/GB after |

For a small app like this, you'll likely stay within free tier.

## Next Steps

1. Create Expo account at https://expo.dev
2. Run `eas login`
3. Run `eas build --platform ios --profile preview`
4. Download and test the build
5. Once satisfied, build production and submit!

## Need Help?
- EAS Docs: https://docs.expo.dev/build/introduction/
- EAS Dashboard: https://expo.dev/accounts/[your-account]/projects/gita
