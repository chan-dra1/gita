# 🕉️ Bhagavad Gita: The Master Manifest & Project Blueprint

This document serves as the **Master Prompt** and single source of truth for the Bhagavad Gita application. It is designed to be shared with developers, designers, and AI models to ensure a consistent, premium, and spiritually resonant experience.

---

## 🚀 1. The Core Purpose
**Mission**: To provide a premium, ad-free, and distraction-free environment for modern scholars and seekers to study the Bhagavad Gita. The app bridges ancient Vedic wisdom with cutting-edge productivity tools, ensuring a "Sattvic" (pure) digital experience.

---

## 💎 2. Premium Feature Suite (The "Gita Pro" Value)
The app operates on a **Hard Paywall** model with a 15-day complimentary trial for early adopters.

1.  **Dharma Blocker (The USP)**: A powerful spiritual productivity tool. When a reminder is set, the app automatically restricts access to "distracting" background apps at the scheduled time. It prompts the user via mobile notifications to return to the app and complete their daily sloka goals. Background apps remain locked until the user finishes reading their selected verses, ensuring dedicated focus on the Gita.
2.  **The Scholarly Stack**:
    *   **700+ Verified Slokas**: Offline-first JSON data.
    *   **Word-by-Word Breakdown**: Authentic Sanskrit-to-English/Hindi meanings for every verse.
    *   **Dual-Language Purports**: High-quality commentaries in English and Hindi, sourced from classical scholarly works.
    *   **Scholar QA**: A cost-optimized AI interface that answers verse-specific context based on scholarly texts.
3.  **Divine Audio Engine**: Offline-optimized recite-and-repeat audio for Sanskrit transliterations using high-quality voices (en-IN fallback).
4.  **Spiritual Reminders**: Non-intrusive, timed notifications to bring users back to their daily sloka goals.
5.  **Duo-Language Support**: Seamless global toggle between English and Hindi for both UI and scripture content.

---

## 🎨 3. UI/UX Design Philosophy: "Mystic Premium"

### Visual Palette
*   **Base**: Deep Midnight (`#0D0D0D`) for focus and eye-comfort.
*   **Secondary**: Matte Charcoal (`#1A1A1A`) for card backgrounds.
*   **Accent**: Divine Gold (`#D4A44C`) for primary CTAs, active states, and sacred elements.
*   **Primary Text**: High-Contrast White (`#FFFFFF`) and Soft Amber (`#B0A090`) for metadata.

### Interaction Patterns
*   **Single Scroll Flow**: Content is centered and stacked vertically. We avoid horizontal tabs within scripture views to ensure a "reading a scroll" experience.
*   **Dial Controls**: Quantitative selections (like daily goals) use haptic-ready [+] and [-] dial interfaces rather than keyboard inputs.
*   **Minimalist Settings**: A unified profile header where the avatar and identity are merged, focusing on utility and elegance.
*   **Glassmorphism**: Subtle use of blurring and transparency for modals and overlays.

---

## 🛠️ 4. Technical Architecture
*   **Framework**: Expo (React Native) with File-based Routing (`expo-router`).
*   **Styling**: Vanilla `StyleSheet` for performance and absolute control.
*   **Data Strategy**: 100% Offline-First. 
    *   `src/data/bhagavad-gita.json`: Verses and word-meanings.
    *   `src/data/purports.json` & `src/data/purports_hi.json`: Extensive multi-language commentaries.
*   **Monetization**: Integrated with **RevenueCat** for hard-locked subscription management.
*   **Deployment**: Vercel (Web Preview) and prepared for Expo Application Services (EAS) for Android/iOS.

---

## 📝 5. Prompt Engineering Snippet (Master Context)
*Use this snippet when asking other AI tools for help:*
> "You are working on the 'Gita Pro' app, a premium React Native/Expo application. This app is designed for scholars and seekers, using a dark-gold aesthetic. It features a Dharma Blocker to stop distractions and includes word-for-word Sanskrit meanings. The UI follows a 'Vertical Scroll' philosophy—no horizontal tabs for content. We prioritize offline-first local JSON data and use RevenueCat for a strict 15-day-trial paywall. When designing, favor Divine Gold (#D4A44C) accents and a high-fidelity, meditative feel."

---

## 📈 6. Current Status & Readiness
- [x] **Data Ingestion**: 700 verses, word-meanings, and dual-purports complete.
- [x] **Hard Paywall**: Mandatory gateway implemented.
- [x] **UI Polish**: Settings merged, Tabs removed for Vertical Scroll.
- [x] **Web Deployment**: LIVE.
- [ ] **Android Production**: Build-Ready (Pending final EAS cloud run).
