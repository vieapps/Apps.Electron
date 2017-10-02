# Apps.Electron
The seeds to build distributions of your apps with Electron

Available for macOS, Windows & Linux

Steps to use:
- Clone this repo to your computer
- Create the folder "www" and copy all your files of ready-to-go app into this
- Replace icon files by your app icon - use this convert tool (https://iconverticons.com/online/) if you need to create icon files from PNG image
- Open the terminal/command promt and change to this directory
- Type "npm install" to install all dependencies
- Type "npm run ebuild" to build the distribution of your app (your distribution file is .DMG file if you build on macOS, .EXE file if you build on Windows, .AppImage/.deb files if you build on Linux)

For more information:
- Electron (Father of ATOM and Visual Studio Code): https://electron.atom.io/
- Electron Builder (The excellent build to do this job): https://www.electron.build/
