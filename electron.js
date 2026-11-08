const path = require("path");
const electron = require("electron");
const { pathToFileURL } = require("url");
const packageJson = require("./package.json");
const { autoUpdater } = require("electron-updater");
let updateDownloaded = false;
const localURL = relative => pathToFileURL(path.join(__dirname, relative)).href;
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const isAlive = window => !!window && !window.isDestroyed();
const trustedDocuments = new WeakMap();

function trustedSender(event, windows, relative) {
	return windows.some(window => {
		if (!isAlive(window) || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) return false;
		const document = trustedDocuments.get(window.webContents);
		return !!document && document.relative === relative && document.url === event.senderFrame.url;
	});
}

function isLocalPage(url, relative) {
	try {
		const parsed = new URL(url);
		parsed.hash = "";
		parsed.search = "";
		return parsed.href === localURL(relative);
	}
	catch (_) { return false; }
}

function openExternal(url) {
	try {
		if (typeof url !== "string" || url.length > 8192) return Promise.resolve(false);
		const parsed = new URL(url);
		if (!["https:", "http:", "mailto:"].includes(parsed.protocol)) return Promise.resolve(false);
		return electron.shell.openExternal(parsed.href).then(() => true);
	}
	catch (_) { return Promise.resolve(false); }
}

function uiEnvironment() {
	const app = {};
	const fallback = { name: packageJson.productName, description: packageJson.description,
		version: packageJson.version, copyright: "© VIEApps.net",
		license: packageJson.license, homepage: packageJson.homepage, frameworks: "" };
	for (const [key, value] of Object.entries(fallback)) app[key] = typeof environment.app[key] === "string" ? environment.app[key] : value;
	return { icon: pathToFileURL(environment.icon).href, app,
		platform: process.platform, versions: process.versions, canInstallUpdates: environment.canInstallUpdates };
}

const environment = {
	icon: path.join(__dirname, "build/icon.png"),
	isDebug: process.argv.slice(2).some(arg => arg === "/dev" || arg === "/debug"),
	openDevTools: process.argv.slice(2).some(arg => arg.startsWith("/dev")),
	canInstallUpdates: false,
	app: {
		id: "vieapps-ngx-portals",
		name: "NGX Portals",
		description: "Manage information and related services of CMS Portals",
		version: packageJson.version,
		copyright: "© VIEApps.net",
		license: "Apache-2.0",
		frameworks: "ionic 5",
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

let appPrimaryWindow, appSecondaryWindow, chatWindow, aboutWindow, updateWindow;

function createWindow(createOptions) {
	createOptions = createOptions || {};
	createOptions.options = createOptions.options || {};
	const isApp = isLocalPage(createOptions.url, "src/app/index.html");
	const isUI = isLocalPage(createOptions.url, "src/about/index.html") || isLocalPage(createOptions.url, "src/update/index.html");
	createOptions.options.webPreferences = {
		backgroundThrottling: false,
		...(createOptions.options.webPreferences || {}),
		nodeIntegration: false,
		contextIsolation: true,
		sandbox: true,
		preload: isApp ? path.join(__dirname, "src/preload-app.js") : isUI ? path.join(__dirname, "src/preload-ui.js") : undefined
	};
	const window = new electron.BrowserWindow(createOptions.options);
	const relative = isApp ? "src/app/index.html" : isLocalPage(createOptions.url, "src/about/index.html")
		? "src/about/index.html" : isUI ? "src/update/index.html" : undefined;
	if (relative) {
		trustedDocuments.set(window.webContents, { relative, url: createOptions.url });
		// pushState changes Angular's file URL without replacing the trusted document.
		window.webContents.on("did-navigate-in-page", (_, url, isMainFrame) => {
			if (isMainFrame) trustedDocuments.set(window.webContents, { relative, url });
		});
		window.webContents.on("did-start-navigation", (_, url, isInPlace, isMainFrame) => {
			if (isMainFrame && !isInPlace) {
				if (isLocalPage(url, relative)) trustedDocuments.set(window.webContents, { relative, url });
				else trustedDocuments.delete(window.webContents);
			}
		});
	}
	window.webContents.setWindowOpenHandler(({ url }) => {
		openExternal(url).catch(() => {});
		return { action: "deny" };
	});
	window.webContents.on("will-navigate", (event, url) => {
		if (relative && !isLocalPage(url, relative)) {
			event.preventDefault();
			openExternal(url).catch(() => {});
		}
	});
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
	window.loadURL(createOptions.url).catch(error => console.error("Window load failed:", error.message));
	return window;
}

function showWindow(window, onNext) {
	if (isAlive(window)) {
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
	if (!isAlive(windowInstance)) {
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
			url: localURL("src/app/index.html"),
			onClose: $event => {
				if (process.platform === "darwin") closeWindow(windowInstance, $event);
			},
			onClosed: () => {
				if (isSecondInstance) appSecondaryWindow = undefined;
				else appPrimaryWindow = undefined;
				windowInstance = undefined;
				if (process.platform !== "darwin" && !isAlive(appPrimaryWindow) && !isAlive(appSecondaryWindow)) electron.app.quit();
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
			url: mode === "web" ? "https://web.telegram.org/z/" : localURL("src/chat/index.html"),
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
			url: localURL("src/about/index.html"),
			onClose: $event => aboutWindow = closeWindow(aboutWindow, $event),
			onClosed: () => aboutWindow = undefined,
			onceDomReady: () => {
				aboutWindow.setMenuBarVisibility(false);
				sendMessage(aboutWindow, "dom-ready", uiEnvironment(), onNext);
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
			url: localURL("src/update/index.html"),
			onClose: $event => updateWindow = closeWindow(updateWindow, $event),
			onClosed: () => updateWindow = undefined,
			onceDomReady: () => {
				updateWindow.setMenuBarVisibility(false);
				sendMessage(updateWindow, "dom-ready", uiEnvironment(), onNext);
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
	if (isAlive(window)) {
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

autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";
autoUpdater.checkingForUpdates = false;
autoUpdater.autoInstallOnAppQuit = false;

async function checkForUpdates() {
	if (process.env.NODE_ENV !== "development" && !autoUpdater.checkingForUpdates) {
		sendMessage(updateWindow, "add-message", { message: "Checking for updates" });
		autoUpdater.checkingForUpdates = true;
		updateDownloaded = false;
		sendMessage(updateWindow, "update-state", { ready: false, canInstall: false });
		try {
			const result = await autoUpdater.checkForUpdates();
			if (result === null) {
				autoUpdater.checkingForUpdates = false;
				sendMessage(updateWindow, "add-message", { message: "Update check skipped: the updater is disabled while running from source without a development update configuration." });
			}
		}
		catch (error) { autoUpdater.emit("error", error); }
	}
}

autoUpdater.on("error", $error => {
	updateDownloaded = false;
	sendMessage(updateWindow, "update-state", { ready: false, canInstall: false });
	sendMessage(updateWindow, "add-message", { message: "Error occurred while checking for updates, try again later.\nDetails: " + String(($error && $error.message) || $error) });
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
	updateDownloaded = true;
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

electron.ipcMain.on("app.updater", (event, $request) => {
	if (!trustedSender(event, [updateWindow], "src/update/index.html")) return;
	if ("QuitAndInstall" === $request && updateDownloaded && environment.canInstallUpdates) {
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

electron.ipcMain.on("App", (event, $info) => {
	if (!trustedSender(event, [appPrimaryWindow, appSecondaryWindow], "src/app/index.html") || !isRecord($info)) return;
	if ("Initialized" == $info.Type && isRecord($info.Data) && isRecord($info.Data.app) && isRecord($info.Data.URIs)) {
		if (["name", "description", "version", "homepage", "copyright", "license", "frameworks"]
			.some(key => $info.Data.app[key] !== undefined && typeof $info.Data.app[key] !== "string")) return;
		const compareVersions = require("compare-versions");
		environment.app = { ...environment.app, ...$info.Data.app };
		environment.app.homepage = $info.Data.app.homepage || $info.Data.URIs.activations;
		try {
			environment.app.version = compareVersions(electron.app.getVersion(), environment.app.version) > 0 ? electron.app.getVersion() : environment.app.version;
		}
		catch (_) { environment.app.version = electron.app.getVersion(); }
		environment.session = $info.Data.session;
		environment.URIs = $info.Data.URIs;
		environment.services = $info.Data.services;
		environment.languages = $info.Data.languages;
		environment.options = $info.Data.options;
		environment.organizations = $info.Data.organizations;
		environment.isDebug = !environment.isDebug ? environment.app.debug : true;
		sendMessage(aboutWindow, "update-info", uiEnvironment());
	}
});

electron.ipcMain.on("Users", (event, $info) => {
	if (!trustedSender(event, [appPrimaryWindow, appSecondaryWindow], "src/app/index.html") || !isRecord($info)) return;
	if ($info.Data !== undefined && !isRecord($info.Data)) return;
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
	else if ("Profile" == $info.Type && isRecord($info.Data) && isRecord(environment.session) && environment.session.token !== undefined) {
		environment.profile = $info.Data;
		createMenu($info.Data.Name);
	}
});

// Internal shell operations: no arbitrary window IDs, modules or OS commands.
electron.ipcMain.on("app.window.close", event => {
	const window = trustedSender(event, [aboutWindow], "src/about/index.html") ? aboutWindow
		: trustedSender(event, [updateWindow], "src/update/index.html") ? updateWindow : undefined;
	if (isAlive(window)) window.close();
});
electron.ipcMain.handle("app.openExternal", (event, url) => {
	if (!trustedSender(event, [appPrimaryWindow, appSecondaryWindow], "src/app/index.html")
		&& !trustedSender(event, [aboutWindow], "src/about/index.html")) return false;
	return openExternal(url);
});
