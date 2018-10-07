const electron = require("electron");

electron.ipcRenderer.on("dom-ready", (_, $environment) => {
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

electron.ipcRenderer.on("clear-messages", () => document.getElementById("messages").innerHTML = "");

electron.ipcRenderer.on("add-message", (_, $message) => {
	const message = document.createElement("div");
	message.innerHTML = $message || ".";
	const container = document.getElementById("messages");
	container.appendChild(message);
});

electron.ipcRenderer.on("update-state", (_, $state) => {
	const ready = $state !== undefined ? $state.ready : false;
	const canInstall = $state !== undefined ? $state.canInstall : false;
	const action = document.getElementById("action");
	action.innerText = ready
		? canInstall
			? "Install updates"
			: "Quit"
		: "Close";
	if (ready) {
		action.classList.add("ready");
		if (canInstall) {
			action.classList.add("can");
		}
	}
});
