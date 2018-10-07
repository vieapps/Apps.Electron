const electron = require("electron");

electron.ipcRenderer.on("dom-ready", (_, $environment) => {
	document.getElementById("version").innerText = "Current version: v" + $environment.app.version;
	const action = document.getElementById("action");
	action.classList.add(process.platform);
	action.parentElement.classList.add(process.platform);
	action.addEventListener("click", () => {
		const state = document.getElementById("action").classList;
		if (state.contains("ready")) {
			electron.ipcRenderer.send("app.updater", state.contains("can") ? "QuitAndInstall" : "Quit");
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

electron.ipcRenderer.on("update-info", (_, $environment) => {
	document.getElementById("version").innerText = "Current version: v" + $environment.app.version;
});

electron.ipcRenderer.on("update-state", (_, $state) => {
	const isReadyToInstall = $state !== undefined ? $state.ready : false;
	const canInstall = $state !== undefined ? $state.canInstall : false;
	const action = document.getElementById("action");
	action.innerText = isReadyToInstall
		? canInstall
			? "Install updates"
			: "Quit"
		: "Close";
	if (isReadyToInstall) {
		action.classList.add("ready");
		if (canInstall) {
			action.classList.add("can");
		}
	}
});