const path = require("path");
const { pathToFileURL } = require("url");
const electron = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log/main");

const packageInfo = require("./package.json");

const environment = {
	icon: path.join(__dirname, packageInfo.build !== undefined ? packageInfo.build.icon : "icons/ngx.png"),
	isDebug: process.argv.slice(2).some(arg => arg === "/dev" || arg === "/debug"),
	openDevTools: process.argv.slice(2).some(arg => arg.startsWith("/dev")),
	canInstallUpdates: false,
	platform: process.platform,
	versions: {
		electron: process.versions.electron,
		chrome: process.versions.chrome,
		node: process.versions.node,
		v8: process.versions.v8
	},
	package: {
		productName: packageInfo.productName,
		description: packageInfo.description,
		version: packageInfo.version,
		license: packageInfo.license,
		homepage: packageInfo.homepage,
		copyright: packageInfo.build !== undefined ? packageInfo.build.copyright : undefined
	},
	app: {
		id: "vieapps-ngx-portals",
		name: "NGX Portals",
		description: "Manage information and related services of CMS Portals",
		version: packageInfo.version,
		copyright: "© VIEApps.net",
		license: "Apache-2.0",
		frameworks: "ionic 9 - angular 22",
		homepage: "https://vieapps.net/"
	},
	session: {
		token: {}
	},
	chat: {
		available: true,
		mode: "web",
		webPreferences: {},
		appPreferences: undefined
	}
};

// -----------------------------------------------------

// pages of this app run sandboxed, with context isolation and without Node.js integration - they talk to the main process via electron.preload.js
function getWebPreferences(options) {
	return Object.assign({
		preload: path.join(__dirname, "electron.preload.js"),
		contextIsolation: true,
		sandbox: true,
		nodeIntegration: false
	}, options || {});
}

function getFileURL(...segments) {
	return pathToFileURL(path.join(__dirname, ...segments)).href;
}

let appPrimaryWindow, appSecondaryWindow, chatWindow, aboutWindow, updateWindow;

function createWindow(createOptions) {
	createOptions = createOptions || {};
	createOptions.options = createOptions.options || {}
	createOptions.options.webPreferences = createOptions.options.webPreferences || getWebPreferences({
		backgroundThrottling: false
	});
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

function createAppWindow(isSecondInstance, onNext) {
	let windowInstance = !!isSecondInstance ? appSecondaryWindow : appPrimaryWindow;
	if (windowInstance === undefined) {
		const displaySize = electron.screen.getPrimaryDisplay().size;
		const width = displaySize.width > 1680 ? 1680 : displaySize.width > 1440 ? 1440 : displaySize.width > 1366 ? 1366 : displaySize.width > 1280 ? 1280 : 1024;
		const height = displaySize.height > 900 ? 900 : displaySize.height > 800 ? 800 : 700;
		windowInstance = createWindow({
			options: {
				width: width,
				height: height,
				minWidth: 480,
				minHeight: 320,
				icon: environment.icon,
				show: false
			},
			url: getFileURL("src/app/index.html"),
			onClose: $event => {
				if (process.platform === "darwin") {
					closeWindow(windowInstance, $event);
				}
			},
			onClosed: () => {
				if (isSecondInstance) {
					appSecondaryWindow = undefined;
				}
				else {
					appPrimaryWindow = undefined;
				}
				windowInstance = undefined;
				if (process.platform !== "darwin" && appPrimaryWindow === undefined && appSecondaryWindow === undefined) {
					electron.app.quit();
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
			appSecondaryWindow = windowInstance;
		}
		else {
			appPrimaryWindow = windowInstance;
		}
	}
	else {
		showWindow(windowInstance, onNext);
	}
}

function createChatWindow(onNext) {
	if (chatWindow === undefined) {
		const displaySize = electron.screen.getPrimaryDisplay().size;
		const width = displaySize.width > 1200 ? 992 : 768;
		const height = displaySize.height > 1024 ? 1024 : displaySize.height > 800 ? 800 : 650;
		const left = displaySize.width - width - 50;
		const top = displaySize.height - height - 100;
		const mode = environment.chat.mode || "web";
		const preferences = environment.chat[mode + "Preferences"];
		chatWindow = createWindow({
			options: {
				width: width,
				height: height,
				minWidth: 320,
				minHeight: 480,
				x: left,
				y: top,
				title: "Chat (Powered by Telegram)",
				icon: environment.icon,
				show: mode === "web",
				webPreferences : preferences
			},
			url: mode === "web" ? "https://web.telegram.org/z/" : getFileURL("src/chat/index.html"),
			onClose: $event => chatWindow = closeWindow(chatWindow, $event),
			onClosed: () => chatWindow = undefined,
			onReadyToShow: () => chatWindow.show()
		});
		chatWindow.on("page-title-updated", event => event.preventDefault());
	}
	else {
		showWindow(chatWindow, onNext);
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
			url: getFileURL("src/about/index.html"),
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
			url: getFileURL("src/update/index.html"),
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
			label: environment.app !== undefined ? environment.app.name : electron.app.name,
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
					label: !!authenticatedInfo ? "Profile" + (typeof authenticatedInfo === "string" ? " (" + authenticatedInfo + ")" : "") : "Log In",
					click: () => sendMessageToApp("Navigate", { Type: !!authenticatedInfo ? "Profile" : "LogIn" })
				},
				{
					type: "separator"
				},
				{
					label: "Open secondary app instance",
					click: () => createAppWindow(true)
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
				{ role: "pasteAndMatchStyle" },
				{ role: "delete" },
				{ role: "selectAll" }
			]
		},
		{
			label: "View",
			submenu: [
				{ role: "resetZoom" },
				{ role: "zoomIn" },
				{ role: "zoomOut" },
				{ type: "separator" },
				{ role: "togglefullscreen" },
				{ type: "separator" },
				{ role: "toggleDevTools" }
			]
		},
		{
			role: "window",
			submenu: [
				{ role: "close" }
			]
		}
	];

	if (environment.chat.available) {
		template[0].submenu.splice(5, 0, { type: "separator" }, { label: "Chat (Powered by Telegram)", click: () => createChatWindow() });
	}

	if (process.platform === "darwin") {
		template[0].submenu = template[0].submenu.concat([
			{
				type: "separator"
			},
			{
				role: "hide",
			},
			{
				role: "hideOthers",
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

function sendMessageToApp(event, args, onNext) {
	sendMessage(appPrimaryWindow, "electron.ipc2app", { event: event, args: args }, onNext);
}

// -----------------------------------------------------

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
autoUpdater.checkingForUpdates = false;
autoUpdater.autoInstallOnAppQuit = false;

async function checkForUpdates() {
	if (process.env.NODE_ENV !== "development" && !autoUpdater.checkingForUpdates) {
		sendMessage(updateWindow, "add-message", { message: "Checking for updates" });
		autoUpdater.checkingForUpdates = true;
		try {
			const result = await autoUpdater.checkForUpdates();
			if (result === null) {
				autoUpdater.checkingForUpdates = false;
				sendMessage(updateWindow, "add-message", { message: "Update check skipped: the updater is disabled while running from source without a development update configuration." });
			}
			else if (result.downloadPromise) {
				await result.downloadPromise;
			}
		}
		catch (error) {
			// The updater normally emits error before rejecting; do not report it twice.
			if (autoUpdater.checkingForUpdates) {
				autoUpdater.emit("error", error);
			}
		}
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
	sendMessage(updateWindow, "add-message", { message: "No new update is available, you are at the latest version (v" + environment.app.version + ")" });
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
// replacements of electron.remote / shell usage of the renderer pages (sandboxed now)

electron.ipcMain.on("window.close", $event => {
	const window = electron.BrowserWindow.fromWebContents($event.sender);
	if (window !== null) {
		window.close();
	}
});

electron.ipcMain.on("shell.openExternal", (_, $url) => {
	try {
		const url = new URL($url);
		if (url.protocol === "https:" || url.protocol === "http:") {
			electron.shell.openExternal(url.href);
		}
	}
	catch { }
});

// ----------------------------------------------------------------------

electron.app.on("ready", () => {
	createMenu();
	createAboutWindow();
	createUpdateWindow();
	createAppWindow();

	if (process.platform === "win32") {
		const childProcess = require("child_process");
		childProcess.exec("NET SESSION", ($error, $stdout, $stderr) => environment.canInstallUpdates = $stderr.length === 0);
	}
	else {
		environment.canInstallUpdates = true;
	}

	setTimeout(() => checkForUpdates(), process.platform === "win32" ? 3456 : 12345);
});

electron.app.on("activate", () => createAppWindow());

electron.app.on("before-quit", () => electron.app.willQuit = true);

electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		electron.app.quit();
	}
});

// ----------------------------------------------------------------------

electron.ipcMain.on("App", (_, $info) => {
	if (environment.isDebug) {
		console.log("[IPC] App <= " + ($info !== undefined ? $info.Type : "(no info)"));
	}
	if ("Initialized" == $info.Type) {
		const compareVersions = require("compare-versions");
		environment.app = $info.Data.app;
		environment.app.homepage = $info.Data.app.homepage || $info.Data.URIs.activations;
		environment.app.version = compareVersions.compareVersions(electron.app.getVersion(), environment.app.version) > 0 ? electron.app.getVersion() : environment.app.version;
		environment.session = $info.Data.session;
		environment.URIs = $info.Data.URIs;
		environment.services = $info.Data.services;
		environment.languages = $info.Data.languages;
		environment.options = $info.Data.options;
		environment.organizations = $info.Data.organizations;
		environment.isDebug = !environment.isDebug ? environment.app.debug : true;
		sendMessage(aboutWindow, "update-info", environment);
	}
});

electron.ipcMain.on("Users", (_, $info) => {
	if (environment.isDebug) {
		console.log("[IPC] Users <= " + ($info !== undefined ? $info.Type : "(no info)"));
	}
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
