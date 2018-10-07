const electron = require("electron");

electron.ipcRenderer.on("dom-ready", (_, $environment) => {
	document.getElementById("version").innerText = "Current version: v" + $environment.app.version;
	document.getElementById("action").addEventListener("click", () => {
		if (document.getElementById("action").classList.contains("true")) {
			electron.ipcRenderer.send("app.updater", "QuitAndInstall");
		}
		electron.remote.getCurrentWindow().close();
	});
});

electron.ipcRenderer.on("clear-messages", (_, $info) => {
	document.getElementById("messages").innerHTML = "";
});

electron.ipcRenderer.on("add-message", (_, $message) => {
	const message = document.createElement("div");
	message.innerHTML = $message || ".";
	document.getElementById("messages").appendChild(message);
});

electron.ipcRenderer.on("update-state", (_, $state) => {
	const isReadyToInstall = $state !== undefined ? $state : false;
	const action = document.getElementById("action");
	action.innerText = isReadyToInstall ? "Install updates" : "Close";
	action.classList.remove(isReadyToInstall ? "false" : "true");
	action.classList.add(isReadyToInstall ? "true" : "false");
	const announcement = document.getElementById("announcement");
	announcement.innerText = isReadyToInstall ? "Updates will be installed when reload the app" : "";
	announcement.classList.remove(isReadyToInstall ? "false" : "true");
	announcement.classList.add(isReadyToInstall ? "true" : "false");
});