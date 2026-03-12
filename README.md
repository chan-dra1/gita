# Bhagavad Gita App 🕉️

A beautiful spiritual companion app featuring all 701 slokas of the Bhagavad Gita with commentary, progress tracking, and personalized onboarding.

## Features ✨

- **Complete Bhagavad Gita**: All 18 chapters, 701 verses
- **4-Step Onboarding**: Personalized experience with motivation, experience level, guidance style, and daily commitment
- **Progress Tracking**: Track verses read, day streaks, and saved slokas
- **Real Commentary**: Detailed verse explanations with practical applications
- **Audio Coming Soon**: Sanskrit and English recitations (premium feature)
- **Cross-Platform**: iOS, Android, and Web

## Tech Stack 🛠️

- **Framework**: [Expo](https://expo.dev) + React Native
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind CSS for RN)
- **Storage**: AsyncStorage for offline data
- **Build**: EAS (Expo Application Services)
- **Deploy**: Vercel (web), App Store/Play Store (mobile)

## Quick Start 🚀

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
i

# Run on Android emulator
a

# Run on web
w
```

## Deployment 📦

### GitHub Repository
Repository: `https://github.com/chan-dra1/gita.git`

```bash
# Push to GitHub
git remote add origin https://github.com/chan-dra1/gita.git
git branch -M main
git push -u origin main
```

### Vercel (Web)

**Option 1: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Option 2: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import from GitHub: `chan-dra1/gita`
4. Framework: Other
5. Build Command: `npx expo export --platform web`
6. Output Directory: `dist`
7. Deploy!

### Mobile App Stores

**EAS Build (Recommended)**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for iOS (simulator testing)
eas build --platform ios --profile preview

# Build for Android (APK testing)
eas build --platform android --profile preview

# Build for App Store
eas build --platform ios --profile production

# Build for Play Store
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

See [EAS_SETUP.md](./EAS_SETUP.md) for detailed instructions.

## Project Structure 📁

```
app/
├── (tabs)/              # Main tab navigation
│   ├── index.tsx        # Home - Daily verse
│   ├── daily.tsx        # Daily Intent
│   ├── library.tsx      # Chapter browser with progress
│   └── profile.tsx      # Stats & settings
├── onboarding/          # 4-step onboarding + paywall
│   ├── step1.tsx        # Motivation selection
│   ├── step2.tsx        # Experience level
│   ├── step3.tsx        # Guidance style
│   ├── step4.tsx        # Daily commitment
│   └── paywall.tsx      # Premium upgrade
├── sloka/
│   └── [chapter]/
│       └── [verse].tsx  # Sloka detail with commentary
└── settings.tsx         # App settings

src/
├── data/
│   ├── bhagavad-gita.json   # All 701 verses
│   └── commentary.json      # Verse commentaries
├── utils/
│   ├── stats.ts             # Progress tracking
│   ├── commentary.ts        # Commentary loader
│   └── sloka.ts             # Sloka utilities
└── types/
    └── index.ts             # TypeScript types
```

## Features In Detail 🔍

### Onboarding Flow
1. **Step 1**: What brings you to the Gita? (Motivation)
2. **Step 2**: How familiar are you? (Beginner → Scholar)
3. **Step 3**: What style of guidance? (Practical/Philosophical/Devotional/Holistic)
4. **Step 4**: Daily commitment (2/5/15+ minutes) + reminders
5. **Paywall**: Premium features ($4.99/month, $29.99/year, $99.99/lifetime)

### Stats Tracking
- **Slokas Read**: Unique verses opened
- **Day Streak**: Consecutive days of app use
- **Saved Slokas**: Bookmarked verses
- **Chapter Progress**: Read/unread tracking per chapter

### Commentary System
- **Traditional Wisdom**: Insights from Shankaracharya
- **Spiritual Meaning**: Verse interpretation
- **In Your Life**: Practical application

## Testing 🧪

```bash
# Run feature tests
node test-features.mjs

# Build for web
npx expo export --platform web

# Build for mobile (with EAS)
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

## Premium Features (Coming Soon) 🔐

- Audio recitations in Sanskrit & English
- AI-powered sloka recommendations
- Offline caching
- Ad-free experience

## License 📄

MIT License - feel free to use and modify!

## Contact 📬

GitHub: [chan-dra1/gita](https://github.com/chan-dra1/gita)

---

**Vande Mataram** 🙏
