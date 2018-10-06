const path = require("path");
const console = require("console");
const electron = require("electron");
const log = require("electron-log");
const { autoUpdater } = require("electron-updater");

const environment = {
	icon: path.join(__dirname, "src/app-primary/assets/images/icon.png"),
	isDebug: process.argv.slice(2).find(arg => arg === "/dev" || arg === "/debug") !== undefined,
	openDevTools: process.argv.slice(2).find(arg => arg === "/dev" || arg === "/devtools") !== undefined,
	checkingForUpdates: false,
	app: {
		id: "vieapps-ngx",
		name: "VIEApps",
		description: "Wonderful apps from VIEApps.net",
		version: "1.0.0",
		copyright: "© 2018 VIEApps.net",
		license: "Apache-2.0",
		frameworks: ".net core 2.1 - ionic 4.0-beta.12 - angular 6.1.9 - cordova 8.0.0",
		homepageURI: "https://vieapps.net/"
	}
};

// -----------------------------------------------------

let primaryAppWindow, secondaryAppWindow, aboutWindow, updateWindow;

function createWindow(options, url, onClose, onClosed, onDomReady) {
	const window = new electron.BrowserWindow(options);
	window.loadURL(url);
	if (onClose !== undefined) {
		window.on("close", $event => onClose($event));
	}
	if (onClosed !== undefined) {
		window.on("closed", $event => onClosed($event));
	}
	if (onDomReady !== undefined) {
		window.webContents.once("dom-ready", $event => onDomReady($event));
	}
	if (environment.openDevTools) {
		window.webContents.openDevTools({ mode: "detach" });
	}
	return window;
}

function showWindow(window, onNext) {
	if (window !== undefined) {
		window.show();
	}
	if (onNext !== undefined) {
		onNext();
	}
}

function closeWindow(window, event) {
	if (electron.app.willQuit) {
		return undefined;
	}
	else {
		event.preventDefault();
		window.hide();
		return window;
	}
}

function sendMessage(window, event, data, onNext) {
	if (window !== undefined) {
		window.webContents.send(event, data);
	}
	if (onNext !== undefined) {
		onNext();
	}
}

function sendMessageToApp(appWindow, event, args, onNext) {
	sendMessage(appWindow, "electron.ipc2app", { event: event, args: args }, onNext);
}

function sendMessageToPrimaryApp(event, args, onNext) {
	sendMessageToApp(primaryAppWindow, event, args, onNext);
}

function sendMessageToSecondaryApp(event, args, onNext) {
	sendMessageToApp(secondaryAppWindow, event, args, onNext);
}

function createPrimaryAppWindow(onNext) {
	if (primaryAppWindow === undefined) {
		primaryAppWindow = createWindow(
			{
				width: 1280,
				height: 800,
				minWidth: 320,
				minHeight: 480,
				icon: environment.icon
			},
			path.join("file://", __dirname, "src/app-primary/index.html"),
			$event => primaryAppWindow = closeWindow(primaryAppWindow, $event),
			() => primaryAppWindow = undefined,
			() => sendMessage(primaryAppWindow, "dom-ready", environment, onNext)
		);
	}
	else {
		showWindow(primaryAppWindow, onNext);
	}
}

function createSecondaryAppWindow(onNext) {
	if (secondaryAppWindow === undefined) {
		secondaryAppWindow = createWindow(
			{
				width: 480,
				height: 768,
				minWidth: 320,
				minHeight: 480,
				icon: environment.icon
			},
			path.join("file://", __dirname, "src/app-secondary/index.html"),
			$event => secondaryAppWindow = closeWindow(secondaryAppWindow, $event),
			() => secondaryAppWindow = undefined,
			() => sendMessage(secondaryAppWindow, "dom-ready", environment, onNext)
		);
	}
	else {
		showWindow(secondaryAppWindow, onNext);
	}
}

function createAboutWindow(onNext) {
	if (aboutWindow === undefined) {
		aboutWindow = createWindow(
			{
				width: 550,
				height: 260,
				frame: false
			},
			path.join("file://", __dirname, "src/about/index.html"),
			$event => aboutWindow = closeWindow(aboutWindow, $event),
			() => aboutWindow = undefined,
			() => sendMessage(aboutWindow, "dom-ready", environment, onNext)
		);
	}
	else {
		showWindow(aboutWindow, onNext);
	}
}

function createUpdateWindow(onNext) {
	if (updateWindow === undefined) {
		updateWindow = createWindow(
			{
				width: 550,
				height: 260
			},
			path.join("file://", __dirname, "src/update/index.html"),
			$event => updateWindow = closeWindow(updateWindow, $event),
			() => updateWindow = undefined,
			() => sendMessage(updateWindow, "dom-ready", environment, onNext)
		);
	}
	else {
		showWindow(updateWindow, onNext);
	}
}

// -----------------------------------------------------

function createMenu(authenticatedInfo) {
	const template = [
		{
			label: electron.app.getName(),
			submenu: [
				{
					label: "About " + electron.app.getName(),
					click: () => createAboutWindow()
				},
				{ type: "separator" },
				{
					label: "Check for updates...",
					click: () => createUpdateWindow(() => sendMessage(updateWindow, "clear-messages", undefined, () => checkForUpdates()))
				},
				{
					type: "separator"
				},
				{
					label: authenticatedInfo ? "Profile" + (typeof authenticatedInfo === "string" ? " (" + authenticatedInfo + ")" : "") : "Log In",
					click: () => sendMessageToPrimaryApp("Navigate", { Type: authenticatedInfo ? "Profile" : "LogIn" })
				}
			]
		},
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

	if (process.platform === "darwin") {
		template[0].submenu = template[0].submenu.concat([
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

	template[0].submenu = template[0].submenu.concat([
		{
			type: "separator"
		},
		{
			role: "quit"
		}
	]);

	if (environment.isDebug || environment.openDevTools) {
		template[2].submenu = template[2].submenu.concat([
			{ type: "separator" },
			{ role: "toggledevtools" }
		]);
	}

	electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate(template));
}

// -----------------------------------------------------

function checkForUpdates() {
	if (!environment.checkingForUpdates) {
		sendMessage(updateWindow, "add-message", "Checking for updates...");
		environment.checkingForUpdates = true;
		autoUpdater.autoInstallOnAppQuit = true;
		autoUpdater.checkForUpdates();
	}
}

autoUpdater.on("error", (_, $error) => {
	sendMessage(updateWindow, "add-message", "Error occurred while checking for updates... Please try again later!");
	environment.checkingForUpdates = false;
	log.error($error);
});

autoUpdater.on("update-available", (_, $info) => {
	createUpdateWindow(() => sendMessage(updateWindow, "add-message", "Updates are available."));
	log.info($info);
});

autoUpdater.on("update-not-available", (_, $info) => {
	sendMessage(updateWindow, "add-message", "No update is available.");
	log.info($info);
	environment.checkingForUpdates = false;
});

autoUpdater.on("download-progress", (_, $progress) => {
	sendMessage(updateWindow, "add-message", "Downloading...");
	log.info($progress);
});

autoUpdater.on("update-downloaded", (_, $info) => {
	createUpdateWindow(() => {
		sendMessage(updateWindow, "add-message", "Updates downloaded...");
		sendMessage(updateWindow, "update-state", true);
	});
	log.info($info);
});

electron.ipcMain.on("autoUpdater", (_, $request) => {
	if ("QuitAndInstall" === $request) {
		electron.app.willQuit = true;
		environment.checkingForUpdates = false;
		if (aboutWindow !== undefined) {
			aboutWindow.close();
		}
		if (updateWindow !== undefined) {
			updateWindow.close();
		}
		if (secondaryAppWindow !== undefined) {
			secondaryAppWindow.close();
		}
		if (process.platform === "darwin" && primaryAppWindow !== undefined) {
			primaryAppWindow.close();
		}
		autoUpdater.quitAndInstall();
	}
});

// ----------------------------------------------------------------------

electron.app.on("ready", () => {
	createPrimaryAppWindow();
	createMenu();
	setTimeout(() => checkForUpdates(), 13000);
});

electron.app.on("activate", () => createPrimaryAppWindow());

electron.app.on("before-quit", () => electron.app.willQuit = true);

electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		electron.app.quit();
	}
});

// ----------------------------------------------------------------------

electron.ipcMain.on("App", (_, $info) => {
	if ("Initialized" == $info.Type) {
		const compareVersions = require("compare-versions");
		environment.app = $info.Data.app;
		environment.app.homepageURI = $info.Data.URIs.activations;
		environment.app.version = compareVersions(electron.app.getVersion(), environment.app.version) > 0
			? electron.app.getVersion()
			: environment.app.version;
		environment.session = $info.Data.session;
		environment.URIs = $info.Data.URIs;
		environment.options = $info.Data.options;
		environment.organizations = $info.Data.organizations;
		environment.services = $info.Data.services;
		if (!environment.isDebug && environment.app.debug) {
			environment.isDebug = true;
			createMenu(environment.session.token && environment.session.token.uid && environment.session.token.uid !== "");
		}
	}
	if (environment.isDebug) {
		console.log("[App]", $info);
	}
});

electron.ipcMain.on("Users", (_, $info) => {
	if ("LogOut" == $info.Type) {
		environment.session = $info.Data;
		createMenu("LogIn" == $info.Type);
	}
	else if ("LogIn" == $info.Type) {
		environment.session = $info.Data;
		createMenu(true);
	}
	else if ("ProfileUpdated" == $info.Type) {
		createMenu($info.Data.Name);
	}
	if (environment.isDebug) {
		console.log("[Users]", $info);
	}
});
