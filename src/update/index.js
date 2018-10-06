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
	const button = document.getElementById("action");
	button.innerText = isReadyToInstall ? "Install updates" : "Close";
	button.classList.remove(isReadyToInstall ? "false" : "true");
	button.classList.add(isReadyToInstall ? "true" : "false");
});