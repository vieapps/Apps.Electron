// electron main component
"use strict";
const electron = require("electron");

// module to control application life
const app = electron.app;

// module to create native browser window
const BrowserWindow = electron.BrowserWindow;

// module to work with file path
const path = require("path")

// main window
let mainWindow;

function createWindow() {
	// create the browser window
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		minWidth: 320,
		minHeight: 480,
		backgroundColor: "#fff",
		icon: path.join(__dirname, "www/assets/images/icon.png")
	});

	// url to open
	let url = "file://" + __dirname + "/www/index.html";

	// and load the index.html of the app
	mainWindow.loadURL(url);

	// open the DevTools of Chromium
	let args = process.argv.slice(2);
	args.forEach((arg) => {
		if (arg === "devtools") {
			mainWindow.webContents.openDevTools();
		}
	});

	// emitted when the window is closed
	mainWindow.on("closed", () => {
		// dereference the window object, usually you would store windows in an array if your app supports multi windows,
		// this is the time when you should delete the corresponding element
		mainWindow = null;
	});
}

// this method will be called when Electron has finished initialization and is ready to create browser windows
// some APIs can only be used after this event occurs
app.on("ready", createWindow);

// quit when all windows are closed
app.on("window-all-closed", () => {
	// on macOS it's common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// on macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open
	if (mainWindow === null) {
		createWindow();
	}
});