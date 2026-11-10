# Electron shell for a SPA app

Electron shell for a SPA app on macOS, Windows and Linux.

## Frontend resources

Build the SPA app, then copy its contents (`www`) into `src/app`. The shell loads `src/app/index.html` through `file://`. This project does not build or migrate the frontend.

## Install and run

Use Node >=22.12.0 (Node 24 recommended). Install dependencies with:

```sh
npm install
```

The project's `postinstall` runs Electron's binary installer automatically. No separate setup command or temporary Node toolchain is required. End users run the Node runtime bundled with Electron.

Start the shell:

```sh
npm run electron
```

To open DevTools:

```sh
npm run electron -- /dev
```

## Build

```sh
npm run electron-build
```

This directly runs `electron-builder --mac --win --linux --publish never`. Builder manages the packaging tools and downloads it needs. To build one platform:

```sh
npm run electron-build-mac
npm run electron-build-win
npm run electron-build-linux
```

Output goes to `dist`. Builds can replace existing artifacts with the same names. No custom staging, worker, version guard or test runner is involved. Builds do not publish releases. Signing follows the standard electron-builder configuration and environment; macOS signing is not forcibly disabled.

Targets: macOS universal DMG/ZIP, Windows NSIS x64/arm64 (oneClick/perMachine), Linux AppImage x64. Runtime requires macOS 13+ or Windows 10+; Linux distribution compatibility depends on the target environment.
