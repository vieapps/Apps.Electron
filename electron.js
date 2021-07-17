const path = require("path");
const electron = require("electron");
const { autoUpdater } = require("electron-updater");

const environment = {
	icon: path.join(__dirname, "build/icon.png"),
	isDebug: process.argv.slice(2).findIndex(arg => arg === "/dev" || arg === "/debug") > -1,
	openDevTools: process.argv.slice(2).findIndex(arg => arg === "/dev" || arg === "/devtools") > -1,
	canInstallUpdates: false,
	app: {
		id: "vieapps-ngx-portals",
		name: "NGX Portals",
		description: "Manage information and related services of CMS Portals",
		version: "1.0.0",
		copyright: "© VIEApps.net",
		license: "Apache-2.0",
		frameworks: "ionic 5.6 - angular 11.2 - cordova 10.0",
		homepage: "https://vieapps.net/"
	},
	session: {
		token: {}
	}
};

// -----------------------------------------------------

let primaryAppWindow, primaryAppSecondWindow, secondaryAppWindow, aboutWindow, updateWindow;

function createWindow(createOptions) {
	createOptions = createOptions || {};
	createOptions.options = createOptions.options || {}
	createOptions.options.webPreferences = {
		nodeIntegration: true,
		enableRemoteModule: true,
		contextIsolation: false,
		worldSafeExecuteJavaScript: true,
		backgroundThrottling: false
	};
	const window = new electron.BrowserWindow(createOptions.options);
	window.loadURL(createOptions.url);
	if (createOptions.onShow !== undefined) {
		window.on("show", $event => createOptions.onShow($event));
	}
	if (createOptions.onReadyToShow !== undefined) {
		window.on("ready-to-show", $event => createOptions.onReadyToShow($event));
	}
	if (createOptions.onClose !== undefined) {
		window.on("close", $event => createOptions.onClose($event));
	}
	if (createOptions.onClosed !== undefined) {
		window.on("closed", $event => createOptions.onClosed($event));
	}
	if (createOptions.onceShow !== undefined) {
		window.once("show", $event => createOptions.onceShow($event));
	}
	if (createOptions.onceDomReady !== undefined) {
		window.webContents.once("dom-ready", $event => createOptions.onceDomReady($event));
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

function createPrimaryAppWindow(onNext, isSecondInstance) {
	let windowInstance = !!isSecondInstance ? primaryAppSecondWindow : primaryAppWindow;
	if (windowInstance === undefined) {
		const displaySize = electron.screen.getPrimaryDisplay().size;
		windowInstance = createWindow({
			options: {
				width: displaySize.width > 1680 ? 1680 : displaySize.width > 1440 ? 1440 : displaySize.width > 1366 ? 1366 : displaySize.width > 1280 ? 1280 : 1024,
				height: displaySize.height > 900 ? 900 : displaySize.height > 800 ? 800 : 700,
				minWidth: 480,
				minHeight: 320,
				icon: environment.icon,
				show: false
			}, 
			url: path.join("file://", __dirname, "src/app-primary/index.html"),
			onClose: $event => windowInstance = process.platform === "darwin" ? closeWindow(windowInstance, $event) : undefined,
			onClosed: () => {
				if (process.platform === "darwin") {
					windowInstance = undefined;
				}
				else {
					if (primaryAppWindow === undefined && primaryAppSecondWindow === undefined) {
						electron.app.quit();
					}
				}
			},
			onceDomReady: () => sendMessage(windowInstance, "dom-ready", environment, onNext),
			onceShow: () => {
				if (environment.openDevTools) {
					windowInstance.webContents.openDevTools({ mode: "right" });
				}
			},
			onReadyToShow: () => windowInstance.show()
		});
		if (!!isSecondInstance) {
			primaryAppSecondWindow = windowInstance;
		}
		else {
			primaryAppWindow = windowInstance;
		}
	}
	else {
		showWindow(windowInstance, onNext);
	}
}

function createSecondaryAppWindow(onNext) {
	if (secondaryAppWindow === undefined) {
		secondaryAppWindow = createWindow({
			options: {
				width: 480,
				height: 700,
				minWidth: 320,
				minHeight: 480,
				x: 100,
				y: 100,
				icon: environment.icon,
				show: false
			}, 
			url: path.join("file://", __dirname, "src/app-secondary/index.html"),
			onClose: $event => secondaryAppWindow = closeWindow(secondaryAppWindow, $event),
			onClosed: () => secondaryAppWindow = undefined,
			onceDomReady: () => {
				secondaryAppWindow.setMenuBarVisibility(false);
				sendMessage(secondaryAppWindow, "dom-ready", environment, onNext);
			},
			onceShow: () => {
				if (environment.openDevTools) {
					secondaryAppWindow.webContents.openDevTools({ mode: "detach" });
				}
			}
		});
	}
	else {
		showWindow(secondaryAppWindow, onNext);
	}
}

function createAboutWindow(onNext) {
	if (aboutWindow === undefined) {
		aboutWindow = createWindow({
			options: {
				width: 550,
				height: process.platform !== "darwin" ? 305 : 280,
				icon: environment.icon,
				show: false,
				resizable: false,
				minimizable: false,
				maximizable: false
			},
			url: path.join("file://", __dirname, "src/about/index.html"),
			onClose: $event => aboutWindow = closeWindow(aboutWindow, $event),
			onClosed: () => aboutWindow = undefined,
			onceDomReady: () => {
				aboutWindow.setMenuBarVisibility(false);
				sendMessage(aboutWindow, "dom-ready", environment, onNext);
			},
			onceShow: () => {
				if (environment.openDevTools) {
					aboutWindow.webContents.openDevTools({ mode: "detach" });
				}
			}
		});
	}
	else {
		showWindow(aboutWindow, onNext);
	}
}

function createUpdateWindow(onNext) {
	if (updateWindow === undefined) {
		updateWindow = createWindow({
			options: {
				width: 550,
				height: process.platform !== "darwin" ? 305 : 280,
				icon: environment.icon,
				show: false,
				resizable: false,
				minimizable: false,
				maximizable: false
			},
			url: path.join("file://", __dirname, "src/update/index.html"),
			onClose: $event => updateWindow = closeWindow(updateWindow, $event),
			onClosed: () => updateWindow = undefined,
			onceDomReady: () => {
				updateWindow.setMenuBarVisibility(false);
				sendMessage(updateWindow, "dom-ready", environment, onNext);
			},
			onceShow: () => {
				if (environment.openDevTools) {
					updateWindow.webContents.openDevTools({ mode: "detach" });
				}
			}
		});
	}
	else {
		showWindow(updateWindow, onNext);
	}
}

function createMenu(authenticatedInfo) {
	const template = [
		{
			label: environment.app !== undefined ? environment.app.name : electron.app.getName(),
			submenu: [
				{
					label: "About",
					click: () => createAboutWindow()
				},
				{ type: "separator" },
				{
					label: "Check for updates",
					click: () => createUpdateWindow(() => sendMessage(updateWindow, "clear-messages", undefined, () => checkForUpdates()))
				},
				{
					type: "separator"
				},
				{
					label: authenticatedInfo !== undefined ? "Profile" + (typeof authenticatedInfo === "string" ? " (" + authenticatedInfo + ")" : "") : "Log In",
					click: () => sendMessageToPrimaryApp("Navigate", { Type: authenticatedInfo ? "Profile" : "LogIn" })
				},
				// {
				// 	type: "separator"
				// },
				// {
				// 	label: "Messages",
				// 	accelerator: "CommandOrControl+M",
				// 	click: () => createSecondaryAppWindow()
				// },
				{
					type: "separator"
				},
				{
					label: "Second Instance of CMS Portals",
					click: () => createPrimaryAppWindow(undefined, true)
				},
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
				{ role: "togglefullscreen" },
				{ type: "separator" },
				{ role: "toggledevtools" }
			]
		},
		{
			role: "window",
			submenu: [
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

	electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate(template));
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

// -----------------------------------------------------

autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";
autoUpdater.checkingForUpdates = false;
autoUpdater.autoInstallOnAppQuit = false;

function checkForUpdates() {
	if (process.env.NODE_ENV !== "development" && !autoUpdater.checkingForUpdates) {
		sendMessage(updateWindow, "add-message", { message: "Checking for updates" });
		autoUpdater.checkingForUpdates = true;
		autoUpdater.checkForUpdates();
	}
}

autoUpdater.on("error", $error => {
	sendMessage(updateWindow, "add-message", { message: "Error occurred while checking for updates, try again later." + "<br/>" + "Details:" + JSON.stringify($error) });
	autoUpdater.checkingForUpdates = false;
});

autoUpdater.on("update-available", $info => {
	sendMessage(updateWindow, "add-message", { message: "New updates are available (version v" + $info.version + ")" });
	sendMessage(updateWindow, "add-message", { message: "Start to download the updates" });
});

autoUpdater.on("update-not-available", $info => {
	sendMessage(updateWindow, "add-message", { message: "No new update is available, you are at the latest version (v" + $info.version + ")" });
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
	sendMessage(updateWindow, "add-message", { id: "progress", message: indicators + "> " + percent + "%" + speed });
});

autoUpdater.on("update-downloaded", $info => {
	autoUpdater.checkingForUpdates = false;
	createUpdateWindow(() => {
		sendMessage(updateWindow, "update-state", { ready: true, canInstall: environment.canInstallUpdates });
		sendMessage(updateWindow, "add-message", { message: "Updates are downloaded (version v" + $info.version + ")" });
		sendMessage(updateWindow, "add-message", { message: environment.canInstallUpdates ? "Click the 'Install updates' button to install and relaunch" : "Click the 'Quit' button to terminate the app, manual relaunch with administrator privileges to install new updates (relaunch by right-click on app shortcut/file and select 'Run as administrator')" });
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
	createAboutWindow();
	createUpdateWindow();
	createPrimaryAppWindow();
	// createSecondaryAppWindow();

	if (process.platform === "win32") {
		const childProcess = require("child_process");
		childProcess.exec("NET SESSION", ($error, $stdout, $stderr) => environment.canInstallUpdates = $stderr.length === 0);
	}
	else {
		environment.canInstallUpdates = true;
	}

	setTimeout(() => checkForUpdates(), process.platform === "win32" ? 3456 : 12345);
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
		environment.app.version = compareVersions(electron.app.getVersion(), environment.app.version) > 0 ? electron.app.getVersion() : environment.app.version;
		environment.session = $info.Data.session;
		environment.URIs = $info.Data.URIs;
		environment.services = $info.Data.services;
		environment.languages = $info.Data.languages;
		environment.options = $info.Data.options;
		environment.organizations = $info.Data.organizations;
		environment.isDebug = !environment.isDebug ? environment.app.debug : true;
		// createSecondaryAppWindow();
		sendMessage(aboutWindow, "update-info", environment);
	}
});

electron.ipcMain.on("Users", (_, $info) => {
	if ("LogOut" === $info.Type || "LogIn" === $info.Type) {
		environment.session = $info.Data;
		environment.profile = {};
		if ("LogOut" == $info.Type) {
			if (environment.session !== undefined) {
				environment.session.account = {};
			}
		}
		createMenu();
	}
	else if ("Profile" == $info.Type && environment.session !== undefined && environment.session.token !== undefined) {
		environment.profile = $info.Data;
		createMenu($info.Data.Name);
	}
});
