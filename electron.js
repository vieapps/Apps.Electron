// main components
"use strict";

const path = require("path")
const electron = require("electron");
const console = require("console");
const environment = {
	icon: path.join(__dirname, "src/main/assets/images/icon.png"),
	isDevelopment: process.env.NODE_ENV !== "production" || process.argv.slice(2).find(arg => arg === "/devenv") !== undefined,
	openDevTools: process.argv.slice(2).find(arg => arg === "/devtools") !== undefined
};

// -----------------------------------------------------

let mainWindow, aboutWindow;

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
	mainWindow.on("ready-to-show", () => mainWindow.show());
	mainWindow.webContents.once("dom-ready", () => mainWindow.webContents.send("window.main", { type: "dom-ready", environment: environment }));
	mainWindow.on("close", $event => {
		if (electron.app.destroying) {
			mainWindow = undefined;
		}
		else {
			$event.preventDefault()
      mainWindow.hide();
		}
	});
	mainWindow.on("closed", () => mainWindow = undefined);
}

function showAboutWindow() {
	if (aboutWindow === undefined) {
		aboutWindow = new electron.BrowserWindow({ width: 550, height: 260, parent: mainWindow, frame: false });
		aboutWindow.loadURL(path.join("file://", __dirname, "src/about/index.html"));
		aboutWindow.on("ready-to-show", () => aboutWindow.show());
		aboutWindow.webContents.once("dom-ready", () => aboutWindow.webContents.send("window.about", {
			type: "dom-ready",
			environment: environment,
			homepageURI: "https://viebooks.net/",
			copyright: "© 2016 - 2018 VIEApps.net",
			license: "Apache 2.0",
			appFrameworks: ".net core 2.1 - ionic 4.0-beta.12 - angular 6.1.9 - cordova 8.0.0"
		}));
		aboutWindow.on("close", $event => {
			if (electron.app.destroying) {
				aboutWindow = undefined;
			}
			else {
				$event.preventDefault()
				aboutWindow.hide();
			}
		});
		aboutWindow.on("closed", () => aboutWindow = undefined);
	}
	else {
		aboutWindow.show();
	}
}

// -----------------------------------------------------

// main menu
function createMainMenu() {
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
				click: () => console.log("Check for updates... => under construction")
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

// ----------------------------------------------------------------------

electron.app.on("ready", () => {
	createMainMenu();
	createMainWindow();
});

electron.app.on("activate", () => {
	// on macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open
	if (mainWindow === undefined) {
		createMainWindow();
	}
	else {
		mainWindow.show();
	}
});

// quit when all windows are closed
// on macOS it's common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q
electron.app.on("before-quit", () => electron.app.destroying = true);

electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		electron.app.quit();
	}
});
