# VIEApps NGX CMS Portals with Electron

Electron shell for the VIEApps NGX CMS Portals app on macOS, Windows and Linux.

## Frontend resources

Build the app, then copy its contents (`platforms/browser/www`) into `src/app`. The shell loads `src/app/index.html` through `file://`. This project does not build or migrate the frontend.

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

Output goes to `dist`, configured by `build.directories.output` in `package.json`. Builds can replace existing artifacts with the same names. No custom staging, worker, version guard or test runner is involved. Builds do not publish releases. Signing follows the standard electron-builder configuration and environment; macOS signing is not forcibly disabled.

Targets: macOS universal DMG/ZIP, Windows NSIS x64/arm64 (oneClick/perMachine), Linux AppImage x64. Runtime requires macOS 13+ or Windows 10+; Linux distribution compatibility depends on the target environment.

## Runtime and updater

Versions: Electron 45.2.3, electron-builder 26.18.1, electron-updater 6.8.12. App version remains 10.2606.1.

Local renderers use isolated, sandboxed preloads. `src/preload-app.js` provides the existing ngx-electron compatibility facade and `window.vieappsDesktop`; `src/preload-ui.js` serves About/Update. These are runtime bridges required by the upgraded shell.

The existing App/Users/electron.ipc2app/app.updater channels are preserved. Arbitrary Node require and remote are unavailable in renderers. External URLs are opened through main with HTTP/HTTPS/mailto validation.

The ordinary shell keeps its timed update check and automatic download policy. `NODE_ENV=development` skips checks; source mode also skips checks unless development updater configuration is explicitly enabled. Installed apps use the generic release endpoint configured in package.json. macOS auto-update installation requires signing and a release ZIP with matching metadata.

The existing resources use path routing under file URLs; direct reload of a virtual route may fail. This upgrade keeps the frontend resources unchanged.
