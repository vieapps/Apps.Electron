const path = require("path");
const console = require("console");
const electron = require("electron");
const { autoUpdater } = require("electron-updater");

const environment = {
	icon: path.join(__dirname, "src/app-primary/assets/images/icon.png"),
	isDebug: process.argv.slice(2).findIndex(arg => arg === "/dev" || arg === "/debug") > -1,
	openDevTools: process.argv.slice(2).findIndex(arg => arg === "/dev" || arg === "/devtools") > -1,
	canInstallUpdates: false,
	app: {
		id: "vieapps-ngx",
		name: "VIEApps NGX",
		description: "Wonderful apps from VIEApps.net",
		version: "1.0.0",
		copyright: "© 2018 VIEApps.net",
		license: "Apache-2.0",
		frameworks: ".net core 2.1 - ionic 4.0 - angular 6.1.9 - cordova 8.0.0",
		homepageURI: "https://vieapps.net/"
	},
	session: {
		token: {}
	}
};

// -----------------------------------------------------

let primaryAppWindow, secondaryAppWindow, aboutWindow, updateWindow;

function createWindow(options, url, onClose, onClosed, onDomReady, dontHideMenu) {
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
	if (!dontHideMenu && process.platform !== "darwin") {
		window.setMenuBarVisibility(false);
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
			$event => {
				if (process.platform === "darwin") {
					primaryAppWindow = closeWindow(primaryAppWindow, $event);
				}
			},
			() => {
				if (process.platform === "darwin") {
					primaryAppWindow = undefined;
				}
				else {
					electron.app.quit();
				}
			},
			() => sendMessage(primaryAppWindow, "dom-ready", environment, onNext),
			process.platform !== "darwin"
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
				height: process.platform !== "darwin" ? 305 : 280,
				icon: environment.icon
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
				height: process.platform !== "darwin" ? 305 : 280,
				icon: environment.icon
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

autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";
autoUpdater.checkingForUpdates = false;
autoUpdater.autoInstallOnAppQuit = false;

function checkForUpdates() {
	if (!autoUpdater.checkingForUpdates) {
		sendMessage(updateWindow, "add-message", "Checking for updates");
		autoUpdater.checkingForUpdates = true;
		autoUpdater.checkForUpdates();
	}
}

autoUpdater.on("error", () => {
	sendMessage(updateWindow, "add-message", "Error occurred while checking for updates, try again later");
	autoUpdater.checkingForUpdates = false;
});

autoUpdater.on("update-available", () => {
	sendMessage(updateWindow, "add-message", "New updates are available");
	sendMessage(updateWindow, "add-message", "Start to download the updates");
});

autoUpdater.on("update-not-available", () => {
	sendMessage(updateWindow, "add-message", "No new update is available");
	autoUpdater.checkingForUpdates = false;
});

autoUpdater.on("download-progress", $progress => {
	let indicators = "";
	const percent = Math.round($progress.percent);
	const length = Math.round(percent / 5);
	for (let index = 0; index < length; index++) {
		indicators += "=";
	}
	let speed = "";
	if (percent < 100) {
		speed = Math.round($progress.bytesPerSecond / 1024);
		if (speed > 0) {
			speed = Math.round(speed / 1024);
			speed = speed > 0
				? speed + " MB/s"
				: Math.round($progress.bytesPerSecond / 1024) + " KB/s";
		}
		else {
			speed = $progress.bytesPerSecond + " B/s";
		}
		speed = " (" + speed + ")";
	}
	else {
		indicators += ">";
	}
	sendMessage(updateWindow, "add-message", indicators + "> " + percent + "%" + speed);
});

autoUpdater.on("update-downloaded", () => {
	autoUpdater.checkingForUpdates = false;
	createUpdateWindow(() => {
		sendMessage(updateWindow, "update-state", { ready: true, canInstall: environment.canInstallUpdates });
		sendMessage(updateWindow, "add-message", "Updates are downloaded");
		if (environment.canInstallUpdates) {
			sendMessage(updateWindow, "add-message", "Click the 'Install updates' button to install and relaunch");
		}
		else {
			sendMessage(updateWindow, "add-message", "Click the 'Quit' button to terminate the app, and relaunch with administrator privileges (right-click on app shortcut/file and select 'Run as administrator') to apply new updates");
		}
	});
});

autoUpdater.on("before-quit-for-update", () => {
	electron.app.willQuit = true;
});

electron.ipcMain.on("app.updater", (_, $request) => {
	if ("QuitAndInstall" === $request) {
		autoUpdater.quitAndInstall();
	}
	else if ("Quit" === $request) {
		electron.app.quit();
	}
});

// ----------------------------------------------------------------------

electron.app.on("ready", () => {
	createMenu();
	createPrimaryAppWindow();

	if (process.platform === "win32") {
		const childProcess = require("child_process");
		childProcess.exec("NET SESSION", function(err, so, se) {
			environment.canInstallUpdates = se.length === 0;
		});
	}
	else {
		environment.canInstallUpdates = true;
	}

	setTimeout(() => {
		checkForUpdates();
		if (environment.isDebug) {
			setTimeout(() => console.log("<<Environment>>", environment), 3000);
		}
	}, process.platform === "win32" ? 3000 : 13000);
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
		environment.app.homepage = $info.Data.app.homepage || $info.Data.URIs.activations;
		environment.app.version = compareVersions(electron.app.getVersion(), environment.app.version) > 0
			? electron.app.getVersion()
			: environment.app.version;
		environment.session = $info.Data.session;
		environment.URIs = $info.Data.URIs;
		environment.options = $info.Data.options;
		environment.organizations = $info.Data.organizations;
		environment.services = $info.Data.services;
		environment.languages = $info.Data.languages;
		if (!environment.isDebug && environment.app.debug) {
			environment.isDebug = true;
			createMenu(environment.session.token && environment.session.token.uid && environment.session.token.uid !== "");
		}
		sendMessage(aboutWindow, "update-info", environment);
		sendMessage(updateWindow, "update-info", environment);
	}
	if (environment.isDebug) {
		console.log("[App]", $info);
	}
});

electron.ipcMain.on("Users", (_, $info) => {
	if ("LogOut" == $info.Type || "LogIn" == $info.Type) {
		environment.session = $info.Data;
		if ("LogOut" == $info.Type) {
			environment.session.account = {};
			environment.profile = {};
		}
		createMenu("LogIn" == $info.Type);
	}
	else if ($info.Type !== undefined && $info.Type.Service !== "") {
		if ("Profile" == $info.Type.Object && $info.Data.ID == environment.session.token.uid) {
			environment.profile = $info.Data;
			createMenu($info.Data.Name);
		}
	}
	if (environment.isDebug) {
		console.log("[Users]", $info);
	}
});
