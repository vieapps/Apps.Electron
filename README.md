# Apps.Electron
The seeds to build distributions of your apps with Electron

Available for macOS, Windows & Linux

Steps to use:
- Clone this repo to your computer
- Create the folder named "www", and copy all your files of ready-to-go app into this
- Replace the icons (in the "build" folder) by your app icon - use this convert tool (https://iconverticons.com/online/) if you need to create icon files from your PNG image
- Type "npm install" to install all dependencies (in terminal/command prompt, of course)
- Type "npm run ebuild" to build the distribution of your app (your distribution file is .DMG file if you build on macOS, .EXE file if you build on Windows, .AppImage/.deb files if you build on Linux)

For more information:
- Electron (Father of ATOM and Visual Studio Code): https://electron.atom.io/
- Electron Builder (The excellent build to do this job): https://www.electron.build/
