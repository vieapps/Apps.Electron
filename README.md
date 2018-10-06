# Apps.Electron
The seeds to build distributions of your "desktop" apps with Electron for running well on macOS, Windows & Linux

Steps:
- Clone this repo to your computer
- Copy all ready-to-go files of your app into folder "src/app-primary"
- Replace the icons (in the "build" folder) by your app icon - use this convert tool (https://iconverticons.com/online/) if you need to create icon files from your PNG image
- Type "npm install" to install all dependencies (in terminal/command prompt at the project folder, of course)
- Type "npm run electron" to test your "desktop" app that packed with Electron
- Type "npm run electron-build" to build the distributions of your app (x64 on macOS and Windows)
- Open the folder named "dist" to see the distributions of your "desktop" app.

More information:
- Modify the **publish** section of *package.json* to specify the endpoint of app releases for checking updates (demo value is http://127.0.0.1:8080/)
- Electron (Mother of ATOM, GitHub Desktop, Visual Studio Code, ...): https://electron.atom.io/
- Electron Builder (The excellent tool that does this job): https://www.electron.build/
- Make desktop application with Ionic & Electron (very good step-by-step article): https://competenepal.com/ionic2-electron/ 
