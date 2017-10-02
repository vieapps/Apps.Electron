# Apps.Electron
The seeds to build distributions of your "desktop" apps with Electron for running well on macOS, Windows & Linux

Steps:
- Clone this repo to your computer
- Create the folder named "www", and copy all your files of ready-to-go app into this
- Replace the icons (in the "build" folder) by your app icon - use this convert tool (https://iconverticons.com/online/) if you need to create icon files from your PNG image
- Type "npm install" to install all dependencies (in terminal/command prompt at the project folder, of course)
- Type "npm run electron" to test your "desktop" app that packed with Electron
- Type "npm run ebuild" to build the distribution of your app (your distribution file is .DMG file if you run the build on macOS, .EXE file if you run the build on Windows, .AppImage/.deb files if you run the build on Linux)
- Open the folder named "dist" to see the distributions of your "desktop" app.

For testing: download the file "app for testing.zip" to use as your ready-to-go app (this is browser release of Apps.Books.PWA - https://github.com/vieapps/Apps.Books.PWA)

More information:
- Electron (Father of ATOM and Visual Studio Code): https://electron.atom.io/
- Electron Builder (The excellent build to do this job): https://www.electron.build/
