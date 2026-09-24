<div align="center">

  <img src="./assets/icon.png" width="110" height="110" alt="Merge Logo" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);" />

  # Merge

  **A distraction-free tech blog reader & swipe discovery engine for engineers.**

  [![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
  [![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://www.android.com)
  [![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg?style=for-the-badge)]()

  <p align="center">
    <a href="#-about-merge">About</a> •
    <a href="#-key-features">Features</a> •
    <a href="#-installing-on-android">Install on Android</a> •
    <a href="#-project-architecture">Architecture</a>
  </p>

</div>

---

## 💡 About Merge

**Merge** curates high-impact engineering stories from world-class tech companies—including **Netflix, Stripe, Cloudflare, Uber, GitHub, Figma, Airbnb, and Datadog**—delivering them in an intuitive, fast, and tactile card deck.

Whether catching up on architecture designs during your commute or diving into deep technical write-ups, Merge provides a focused, distraction-free reading experience on your mobile device.

---

## ✨ Key Features

- 🃏 **Tinder-Style Swipe Discovery** — Rapidly triage engineering stories. Swipe right to bookmark and save for later; swipe left to pass. Powered by 60FPS fluid physics via `react-native-reanimated` and `react-native-gesture-handler`.
- 📖 **Distraction-Free Reader** — Clean, typography-first markdown view with calculated reading times, syntax highlighting blocks, one-tap URL copying, and direct links to original engineering blogs.
- 💾 **Offline-First Persistence** — Never lose an article. All saved stories and preferences are stored locally on device using `@react-native-async-storage/async-storage`.
- 🏢 **Curated Engineering Sources** — Filter stories by your favorite tech blogs: Netflix, Stripe, Uber, Cloudflare, GitHub, Figma, Airbnb, and Datadog.
- 🌓 **Dynamic Theme Engine** — Seamlessly toggle between dark and light modes, with full support for system color schemes and custom contrast palettes.

---

## 📲 Installing on Android

You can install Merge on any modern Android smartphone or tablet (Android 8.0+) via the standalone **APK** file.

### Method 1: Direct APK Download on Phone (Recommended)

1. **Download the APK**:
   - Download `merge-android.apk` directly to your phone from the [Latest GitHub Releases](../../releases) (or transfer the file from your computer).
2. **Open the File**:
   - Open your phone's **Files** or **Downloads** app and tap `merge-android.apk`.
3. **Allow Installation from Unknown Sources**:
   - If prompted by Android security (*"For your security, your phone is not allowed to install unknown apps from this source"*):
     - Tap **Settings** in the popup.
     - Toggle on **Allow from this source** for your browser or file manager.
     - Tap the back button to return to the installer.
4. **Complete Installation**:
   - Tap **Install**.
   - Once finished, tap **Open** to launch Merge!

---

### Method 2: Install via ADB (For Developers)

Connect your Android phone via USB with **USB Debugging** enabled in Developer Options:

```bash
# Verify phone is detected
adb devices

# Install APK directly onto phone
adb install -r merge-android.apk
```

---

## 🏗️ Project Architecture

```
merge/
├── App.tsx                     # Shell coordinator, navigation tabs & providers
├── app.json                    # Expo configuration & native bundle IDs (com.raj.merge)
├── eas.json                    # EAS build profiles (development, preview, production)
├── assets/                     # App icons, splash screens, and adaptive vectors
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx       # Bottom navigation bar
│   │   ├── DeviceFrame.tsx     # Responsive layout frame
│   │   ├── SwipeCard.tsx       # Clean thumbnail-first swipe card
│   │   ├── TagArticlesModal.tsx# Filtered articles by topic modal
│   │   └── ImageViewerModal.tsx# Edge-to-edge image viewer modal
│   ├── data/
│   │   └── articles.ts         # Curated engineering blog database & source metadata
│   ├── screens/
│   │   ├── Discover.tsx        # Swipeable gesture card stack (Reanimated)
│   │   ├── Reader.tsx          # Full-screen article reader & external link handlers
│   │   ├── Saved.tsx           # Offline saved reading list, search & filters
│   │   ├── Sources.tsx         # Engineering blog sources catalog
│   │   └── Settings.tsx        # Preferences, dark mode & cache management
│   ├── store.tsx               # Global state with AsyncStorage persistence
│   └── theme.ts                # Design tokens & dark/light color schemes
```
