<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1mXlqUQZHhAAqlofaFcDsJTwnWdtMRxkh

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

# 1. Go to project
cd C:\Users\Raj\Reactjs_Projects\people-crud

# 2. Build React app
npm run build

npm install @capacitor/cli @capacitor/core
npx cap init
# App name: SoloDiary
# App ID: com.solodiary.app (or anything unique in this format)
# Web directory: dist (Make sure you type dist here, not www)
`
√ Name ... SoloDiary
√ Package ID ... raj.solodiary.reactjs
`

# Install the Android Platform
npm install @capacitor/android
npx cap add android

# 3. Sync with Android
npx cap sync

# 4. Build APK
cd android




# i got error i so i didi
in SoloDiary/android/settings.gradle
//add on top
plugins {
    id "org.gradle.toolchains.foojay-resolver-convention" version "0.8.0"
}
then
.\gradlew.bat clean

then
.\gradlew.bat assembleDebug

# 5. Install on device
adb install app\build\outputs\apk\debug\app-debug.apk

# 6. Launch app
adb shell am start -n com.people.crud/.MainActivity

💡 What's next?
Every time you make a change in your React code (like changing a button color or adding a feature):
Run npm run build (Updates the dist folder).
Run npx cap sync (Moves the update to the Android folder).
Run .\gradlew.bat assembleDebug (Creates the new APK).
Do you want to know how to generate a "Release" version for the Pla



…or create a new repository on the command line
echo "# SoloDiary" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/rajprajapati2001/SoloDiary.git
git push -u origin main

…or push an existing repository from the command line
git remote add origin https://github.com/rajprajapati2001/SoloDiary.git
git branch -M main
git push -u origin main


Step 	Command	What it does
1. Check	git status	Shows which files have changed.
2. Stage	git add .	Prepares all changes for the update.
3. Save	git commit -m "..."	Saves the snapshot locally.
4. Upload	git push	Sends everything to GitHub.


PS C:\Users\Raj\Reactjs_Projects\SoloDiary> git remote add origin https://github.com/rajprajapati2001/SoloDiary.git

PS C:\Users\Raj\Reactjs_Projects\SoloDiary> git status

PS C:\Users\Raj\Reactjs_Projects\SoloDiary> git add .
PS C:\Users\Raj\Reactjs_Projects\SoloDiary> git commit -m "solodiary"

PS C:\Users\Raj\Reactjs_Projects\SoloDiary> git push

PS C:\Users\Raj\Reactjs_Projects\SoloDiary> git status

nothing to commit, working tree clean