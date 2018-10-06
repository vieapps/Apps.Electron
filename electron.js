// main components
"use strict";

const path = require("path");
const electron = require("electron");
const log = require("electron-log");
const console = require("console");

const { autoUpdater } = require("electron-updater");

const environment = {
	icon: path.join(__dirname, "src/main/assets/images/icon.png"),
	isDevelopment: process.argv.slice(2).find(arg => arg === "/dev" || arg === "/devenv") !== undefined,
	openDevTools: process.argv.slice(2).find(arg => arg === "/dev" || arg === "/devtools") !== undefined,
	checkingForUpdates: false,
	app: {
		id: "ngx-apps",
		name: "VIEApps",
		description: "Wonderful apps from VIEApps.net",
		version: "1.0.0",
		copyright: "© 2018 VIEApps.net",
		license: "Apache-2.0",
		frameworks: ".net core 2.1 - ionic 4.0-beta.12 - angular 6.1.9 - cordova 8.0.0",
		homepageURI: "https://vieapps.net/"
	}
};

let mainWindow, aboutWindow, updateWindow;

// -----------------------------------------------------

// create main window
function createMainWindow() {
	mainWindow = new electron.BrowserWindow({
		width: 1280,
		height: 800,
		minWidth: 320,
		minHeight: 480,
		icon: environment.icon
	});
	if (environment.openDevTools) {
		mainWindow.webContents.openDevTools();
	}
	mainWindow.loadURL(path.join("file://", __dirname, "src/main/index.html"));
	mainWindow.on("close", $event => {
		if (electron.app.willQuit) {
			mainWindow = undefined;
		}
		else {
			$event.preventDefault()
			mainWindow.hide();
		}
	});
	mainWindow.on("closed", () => mainWindow = undefined);
	mainWindow.webContents.once("dom-ready", () => mainWindow.webContents.send("window.main", {
		type: "dom-ready",
		environment: environment
	}));
}

function showAboutWindow() {
	if (aboutWindow === undefined) {
		aboutWindow = new electron.BrowserWindow({ width: 550, height: 260, parent: mainWindow, frame: false });
		aboutWindow.loadURL(path.join("file://", __dirname, "src/about/index.html"));
		aboutWindow.on("close", $event => {
			if (electron.app.willQuit) {
				aboutWindow = undefined;
			}
			else {
				$event.preventDefault()
				aboutWindow.hide();
			}
		});
		aboutWindow.on("closed", () => aboutWindow = undefined);
		aboutWindow.webContents.once("dom-ready", () => aboutWindow.webContents.send("window.about", {
			type: "dom-ready",
			environment: environment
		}));
	}
	else {
		aboutWindow.show();
	}
}

// -----------------------------------------------------

// main menu
function createMainMenu(name) {
	const template = [
		{
			label: "Edit",
			submenu: [
				{ role: "undo" },
				{ role: "redo" },
				{ type: "separator" },
				{ role: "cut" },
				{ role: "copy" },
				{ role: "paste" },
				{ role: "pasteandmatchstyle" },
				{ role: "delete" },
				{ role: "selectall" }
			]
		},
		{
			label: "View",
			submenu: [
				{ role: "resetzoom" },
				{ role: "zoomin" },
				{ role: "zoomout" },
				{ type: "separator" },
				{ role: "togglefullscreen" }
			]
		},
		{
			role: "window",
			submenu: [
				{ role: "minimize" },
				{ role: "close" }
			]
		}
	];

	if (environment.isDevelopment) {
		template[1].submenu.push({ type: "separator" });
		template[1].submenu.push({ role: "toggledevtools" });
	}

	const first = {
		label: electron.app.getName(),
		submenu: [
			{
				label: "About " + electron.app.getName(),
				click: () => showAboutWindow()
			},
			{ type: "separator" },
			{
				label: "Check for updates...",
				click: () => createUpdateWindow(() => {
					updateWindow.webContents.send("window.update", { type: "clear" });
					sendUpdateMessage("Checking for updates...");
					if (!environment.checkingForUpdates) {
						environment.checkingForUpdates = true;
						autoUpdater.checkForUpdates();
					}
				})
			},
			{
				type: "separator"
			},
			{
				label: name ? "Profile" + (typeof name === "string" ? " (" + name + ")" : "...") : "Log In",
				click: () => {
					if (name) {
						mainWindow.webContents.send("window.main", { event: "Navigate", args: { Type: "Profile" } });
					}
					else {
						mainWindow.webContents.send("window.main", { event: "Navigate", args: { Type: "LogIn" } });
					}
				}
			}
		]
	};
	if (process.platform === "darwin") {
		first.submenu = first.submenu.concat([
			{
				type: "separator"
			},
			{
				role: "hide",
			},
			{
				role: "hideothers",
			},
			{
				role: "unhide",
			}
		]);
	}
	first.submenu = first.submenu.concat([
		{
			type: "separator"
		},
		{
			role: "quit"
		}
	]);
	template.unshift(first);

	electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate(template));
}

// -----------------------------------------------------

function createUpdateWindow(next) {
	if (updateWindow === undefined) {
		updateWindow = new electron.BrowserWindow({ parent: mainWindow });
		updateWindow.loadURL(path.join("file://", __dirname, "src/update/index.html"));
		updateWindow.on("close", $event => {
			if (electron.app.willQuit) {
				updateWindow = undefined;
			}
			else {
				$event.preventDefault()
				updateWindow.hide();
			}
		});
		updateWindow.on("closed", () => updateWindow = undefined);
		updateWindow.webContents.once("dom-ready", () => {
			updateWindow.webContents.send("window.update", {
				type: "dom-ready",
				environment: environment
			});
			if (next !== undefined) {
				next();
			}
		});
		if (environment.openDevTools) {
			updateWindow.webContents.openDevTools({ mode: "detach" });
		}
	}
	else {
		updateWindow.show();
		if (next !== undefined) {
			next();
		}
	}
}

function sendUpdateMessage(message) {
	if (updateWindow !== undefined) {
		updateWindow.webContents.send("window.update", {
			type: "message",
			message: message
		});
	}
}

autoUpdater.on("error", ($event, $error) => {
	sendUpdateMessage("Error occurred while checking for updates... Please try again later!");
	environment.checkingForUpdates = false;
	log.error($error);
});

autoUpdater.on("update-available", ($event, $info) => {
	log.info($info);
	if (updateWindow === undefined) {
		createUpdateWindow(() => {
			sendUpdateMessage("Checking for updates...");
			sendUpdateMessage("Updates are available.");
		});
	}
	else {
		sendUpdateMessage("Updates are available.");
	}
});

autoUpdater.on("update-not-available", ($event, $info) => {
	log.info($info);
	environment.checkingForUpdates = false;
	sendUpdateMessage("No update is available.");
});

autoUpdater.on("download-progress", ($event, $progress) => {
	log.info($progress);
	if (updateWindow === undefined) {
		createUpdateWindow(() => {
			sendUpdateMessage("Checking for updates...");
			sendUpdateMessage("Updates are available.");
			sendUpdateMessage("Downloading...");
		});
	}
	else {
		sendUpdateMessage("Downloading...");
	}
});

autoUpdater.on("update-downloaded", ($event, $info) => {
	log.info($info);
	if (updateWindow === undefined) {
		createUpdateWindow(() => {
			sendUpdateMessage("Checking for updates...");
			sendUpdateMessage("Updates are available.");
			sendUpdateMessage("Updates downloaded...");
		});
	}
	else {
		sendUpdateMessage("Updates downloaded...");
	}
	setTimeout(() => updateWindow.webContents.send("window.update", { type: "ready"	}), 1500);
});

// ----------------------------------------------------------------------

electron.app.on("ready", () => {
	createMainMenu();
	createMainWindow();
	autoUpdater.autoInstallOnAppQuit = true;
	setTimeout(() => {
		if (!environment.checkingForUpdates) {
			environment.checkingForUpdates = true;
			autoUpdater.checkForUpdates();
		}
	}, 13000);
});

electron.app.on("activate", () => {
	// on macOS it"s common to re-create a window in the app when the dock icon is clicked and there are no other windows open
	if (mainWindow === undefined) {
		createMainWindow();
	}
	else {
		mainWindow.show();
	}
});

// quit when all windows are closed
// on macOS it"s common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q
electron.app.on("before-quit", () => electron.app.willQuit = true);

electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		electron.app.quit();
	}
});

// ----------------------------------------------------------------------

electron.ipcMain.on("autoUpdater", ($event, $info) => {
	if ("QuitAndInstall" === $info.request) {
		environment.checkingForUpdates = false;
		electron.app.willQuit = true;
		autoUpdater.quitAndInstall();
	}
});

electron.ipcMain.on("App", ($event, $info) => {
	if ("Initialized" == $info.Type) {
		environment.app = $info.Data.app;
		environment.app.homepageURI = $info.Data.URIs.activations;
		environment.session = $info.Data.session;
		environment.URIs = $info.Data.URIs;
		environment.options = $info.Data.options;
		environment.organizations = $info.Data.organizations;
		environment.services = $info.Data.services;
		const compareVersions = require("compare-versions");
		if (compareVersions(electron.app.getVersion(), environment.app.version) > 0) {
			environment.app.version = electron.app.getVersion();
		}
		if (environment.isDevelopment) {
			console.log("App Initialized => ", environment);
		}
	}
});

electron.ipcMain.on("Users", ($event, $info) => {
	if (environment.isDevelopment) {
		console.log("Users updated => ", $info);
	}
	if ("LogOut" == $info.Type) {
		environment.session = $info.Data;
		createMainMenu("LogIn" == $info.Type);
	}
	else if ("LogIn" == $info.Type) {
		environment.session = $info.Data;
		createMainMenu(true);
	}
	else if ("ProfileUpdated" == $info.Type) {
		createMainMenu($info.Data.Name);
	}
});
