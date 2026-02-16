![Logo](./assets/solodiary_icon_128x128.png)  

# SoloDiary
SoloDiary is a high-fidelity, tracking web application designed for individuals who demand a structured approach to self-improvement. It combines activity logging, goal management, financial tracking, and personal journaling into a single, aesthetically refined dashboard. Whether you're building habits, tracking your daily wins, or simply reflecting on your day, SoloDiary gives you the tools to measure your growth — beautifully and privately.
`Design Your Routine. Visualize Your Wins. Grow Every Day.`

![SoloDiary Preview](https://img.shields.io/badge/Solo-Diary-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Android](https://img.shields.io/badge/Android-APK_Supported-green?style=for-the-badge&logo=android)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![IndexedDB](https://img.shields.io/badge/IndexedDB-Local_First-emerald?style=for-the-badge)


🌐 Web App: [solo-diary-khaki.vercel.app](https://solo-diary-khaki.vercel.app/)

📱 Android APK: [Download SoloDiary APK](android/app/build/outputs/apk/release/solodiary.apk)


## Screenshots  
![Screenshot](./assets/icons/compltescreenshot.png)  

---
## 🛠️ Technical Stack



| Layer            | Technology                                   |
| :--------------- | :------------------------------------------- |
| **Frontend**     | React.js + Vite + TypeScript                 |
| **Styling**      | Tailwind CSS with custom "Digital" typography|
| **Database**     | IndexedDB (via idb library) — 100% offline   |
| **Icons**        | Lucide React                                 |
| **Reporting**    | html2canvas + jsPDF                          |
| **Mobile**       | Capacitor (for Android APK conversion)       |
| **State Mgmt**   | React Hooks + Context API                    |
| **Build Tool**   | Vite                                         |
| **Pkg Manager**  | npm / yarn                                   |


---

## 📂 Detailed Project Structure

```text
SoloDiary/
├── components/          
│   ├── ActivitiesView.tsx   # View Activity template management
│   ├── CalendarView.tsx     # Monthly point-tracking calendar
│   ├── Dashboard.tsx        # Main UI with time-cards and daily logs
│   ├── DiaryView.tsx        # View diary entries
│   ├── EntryForm.tsx        # Add Events, Goals, Diary, Finance
│   ├── Footer.tsx           # Footer with social links
│   ├── GoalsView.tsx        # Objective setting and tracking interface
│   ├── LineGraph.tsx        # visualized LineGraph
│   └── StatsView.tsx        # Reporting engine & Data Hub (Import/Export)
├── constants/           
│   └── constants.ts         # Initial activity templates (Sleep, Meals, etc.)
├── db/                  
│   └── db.ts                # IndexedDB schema (entries, goals, templates, settings)
├── types/               
│   └── types.ts             # Global TypeScript interfaces (ActivityEntry, Goal)
├── App.tsx              # Core logic, hash-routing, and theme management
├── index.tsx            # React entry point
├── index.html           
└── README.md            # System documentation
```
---


## 🚀 Getting Started
## 🌐 For Web (Reactjs)

#### Installation
#### 1. Clone the repository:
```bash
git clone https://github.com/rajprajapati2001/SoloDiary.git
cd SoloDiary
```
#### 2. Install dependencies:
```bash
npm install
```
#### 3. Run the development server:
```bash
npm run dev
```
#### 4. Build for production:

```bash
npm run build
```
#### 5. Preview production build:

```bash
npm run preview
```
The web app will be available at http://localhost:3000

## 📱 For Android (APK)

### Option 1: Direct Download
Click the button below to download the latest stable APK:

![Android](https://img.shields.io/badge/Android-APK_Supported-green?style=for-the-badge&logo=android)

*Alternatively, copy this link:* 
[Direct APK Link](https://raw.githubusercontent.com/rajprajapati2001/SoloDiary/refs/heads/main/android/app/build/apk/solodiary.apk) 🚀

---
## 📲 Convert Web to APK (Step-by-Step Guide)

SoloDiary uses [Capacitor](https://capacitorjs.com) to bridge the web app into a native Android application. Follow these steps to generate your own build:

### 🛠 Prerequisites
Before starting, ensure you have the following installed:
- [ ] [Android Studio](https://developer.android.com) (with Android SDK)
- [ ] [Java JDK 17+](https://www.oracle.com)

---

### 🚀 Build Process (With Android Studio)

#### Step 1: Clone and Install

```bash
git clone https://github.com/rajprajapati2001/SoloDiary.git
cd SoloDiary
npm install
```

#### Step 2: Build the Web App
```bash
npm run build
```

This creates a `dist` folder with production-ready files.

#### Step 3: Add Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

#### Step 4: Initialize Capacitor
```bash
npx cap init SoloDiary com.yourcompany.solodiary
npx cap add android
```

#### Step 5: Sync Web Build with Android
```bash
npx cap copy
npx cap sync
```

#### Step 6: Open in Android Studio
```bash
npx cap open android
```

#### Step 7: Generate APK in Android Studio
In Android Studio, wait for the project to sync
Go to Build → Build Bundle(s) / APK(s) → Build APK(s)
Wait for the build to complete
**Find your APK at:**`android/app/build/outputs/apk/debug/app-debug.apk` or for 
**Release Builds:** `android/app/build/outputs/apk/release/app-release.apk`

#### Step 8: Install on Device
Transfer the APK to your Android device and install it. You may need to enable `Install from Unknown Sources` in your device settings.
- Pro Tip: Generate Signed Release APK
---
### 🛠 Prerequisites
Before starting, ensure you have the following installed:
- [ ] [Java JDK 17+](https://www.oracle.com)
- [ ] [Android SDK Platform-Tools (For adb)](https://developer.android.com/tools/releases/platform-tools)
- [ ] [Command Line Tools (For sdkmanager)](https://developer.android.com/studio#command-line-tools-only)
- [ ] [Node.js & npm (For React and Capacitor)](https://nodejs.org/)

### 🚀 Build Process (Without Android Studio)

#### Step 1: Clone and Install

```bash
git clone https://github.com/rajprajapati2001/SoloDiary.git
cd SoloDiary
npm install
```

#### Step 2: Build the React production app

```bash
npm run build
```

#### Step 3: Install Capacitor dependencies
```bash
npm install @capacitor/cli @capacitor/core

npx cap init
# Name: SoloDiary
# ID: raj.solodiary.reactjs
# Web directory: dist (Important: Use 'dist', not 'www')
```

#### Step 4: Initialize Capacitor & Android
```bash
npm install @capacitor/android
npx cap add android  # Add the Android platform
```

#### Step 5: Sync & Configure
Synchronize your web code with the Android project.
```bash
npx cap sync 
```
- 🔧 Essential Fix: If you encounter toolchain errors, add the Foojay resolver to `android/settings.gradle` at the very top:
```
Gradle
plugins {
    id "org.gradle.toolchains.foojay-resolver-convention" version "0.8.0"
}
```

#### Step 6: Build the APK
Navigate into the `android folder` and use the Gradle wrapper to compile.
```bash
cd android
```

#### Step 7: Generate APK
```bash
.\gradlew.bat assembleDebug      # Debuged APK
.\gradlew.bat assembleRelease    # Release APK
```
You will find you apk on 
`android/app/build/outputs/apk/debug/app-debug.apk`  
`android/app/build/outputs/apk/release/app-release.apk` this location

### 💡 Quick Development Workflow
If you did changes in website or add any features follow the Steps:

```bash
npm run build
npx cap sync
cd android                 # Locate to Android Folder
.\gradlew.bat clean        # Clean previous builds
.\gradlew.bat assembleDebug
.\gradlew.bat assembleRelease

``` 
**Release Location:** `android\app\build\outputs\apk\release\app-release-unsigned.apk`

---
<details>
  <summary>📝 Create a Keystore File</summary>

#### Step 1: The Keytool Command
Open your terminal and navigate to your project's native Android folder. 
```bash
cd SoloDiary/android/app
keytool -genkey -v -keystore AndroidSoul_keystore_file.jks -alias Soulkey -keyalg RSA -keysize 2048 -validity 10000
```

#### Step 2: What Happens Next?
Once you hit enter, the terminal will ask you a series of questions:
```text
Enter keystore password: Type xxx_raj_apk_xxx (Note: Characters won't appear as you type).
Re-enter new password: Type it again.
What is your first and last name? (e.g., Raj Kumar)
What is the name of your organizational unit? (e.g., Development)
What is the name of your organization? (e.g., SoloDiary)
What is the name of your City or Locality? (e.g., Vapi)
What is the name of your State or Province? (e.g., Gujarat)
What is the two-letter country code? (e.g., IN)
Confirm details: Type yes and press Enter.
```

#### Step 3: Proper File Location
After completing the prompts, a file named `AndroidSoul_keystore_file.jks` will be generated in: `SoloDiary/android/app/AndroidSoul_keystore_file.jks
`
</details>


---
<details>
  <summary>🔑 Signed APK Process</summary>
  
#### Step 1: Place Your Keystore File
Move your `AndroidSoul_keystore_file.jks` into the following folder:
`SoloDiary/android/app/`

#### Step 2: Configure Gradle Credentials
Instead of typing your password every time, add your details to the `gradle.properties` file located at `SoloDiary/android/gradle.properties`:

Properties
#### SoloDiary Signing Credentials
```bash
MY_APP_RELEASE_STORE_FILE=AndroidSoul_keystore_file.jks
MY_APP_RELEASE_KEY_ALIAS=Soulkey
MY_APP_RELEASE_STORE_PASSWORD=xxx_raj_apk_xxx
MY_APP_RELEASE_KEY_PASSWORD=xxx_raj_apk_xxx
```

#### Step 3: Link Credentials in `build.gradle`
Open `SoloDiary/android/app/build.gradle` and modify the android block to include signingConfigs:
```bash
Gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file(MY_APP_RELEASE_STORE_FILE)
            storePassword MY_APP_RELEASE_STORE_PASSWORD
            keyAlias MY_APP_RELEASE_KEY_ALIAS
            keyPassword MY_APP_RELEASE_KEY_PASSWORD
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release  // <--- This signs the APK
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```
#### 🚀 Build Your Signed APK
Run these commands from your project root:
```bash
npm run build
npx cap sync
cd android
.\gradlew.bat assembleRelease
```

#### Signed APK File Location
Once the build is complete, your signed production APK will be located at:

`SoloDiary/android/app/build/outputs/apk/release/app-release.apk`

Note: If you see a file named app-release-unsigned.apk, it means the signing config step was skipped. Ensure the signingConfig signingConfigs.release line is present in your build.gradle
</details>

---

<details>
  <summary>✅ Signature Verification</summary>
After running your build, you should verify that the APK is correctly signed. This uses the apksigner tool located in your Android SDK build-tools folder.

#### Step 1: Run the Verify Command
Navigate to your APK location and run:
```bash
apksigner verify --verbose --print-certs app\build\outputs\apk\release\app-release.apk
```

#### Step 2: What to look for in the output:
Verified using v2 scheme: Should be true.

- **Signer #1 certificate DN:** Look for the name/details you entered when creating the keystore.

- **Signer #1 certificate SHA-256 digest:** This is your unique "App Fingerprint."

#### 💡 Pro Tip: 
If you see CN=Android Debug, the APK is not signed with your production key. Go back and check that the signingConfig line in your build.gradle is correct.

#### 📂 Final Project Structure Summary
Your SoloDiary project should now look like this for a clean CLI workflow:
```text
SoloDiary/
├── android/
│   ├── app/
│   │   ├── build.gradle              <-- (Updated with signingConfigs)
│   │   └── AndroidSoul_keystore_file.jks  <-- (Your Key File)
│   ├── settings.gradle               <-- (Updated with Foojay Plugin)
│   └── gradle.properties             <-- (Contains your ID and Passwords)
├── dist/                             <-- (Your React Build Output)
├── build-apk.bat                     <-- (Optional automation scripts)
└── README.md                         <-- (This guide!)
```
#### ⚠️ Security Reminder
Since your `gradle.properties` now contains your `passwords`, please ensure you add this line to your `.gitignore` file before pushing your code to GitHub or any public server:

`android/gradle.properties`
</details>

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).

---
**Raj Prajapati**

Developed on `15th February 2026`/`Sunday`.