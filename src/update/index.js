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
	document.getElementById("messages").style.height = (window.innerHeight - 80) + "px";
});

electron.ipcRenderer.on("clear-messages", () => document.getElementById("messages").innerHTML = "");

electron.ipcRenderer.on("add-message", (_, $data) => {
	const messages = document.getElementById("messages");
	let message = $data.id && $data.id !== "" ? document.getElementById($data.id) : undefined;
	if (!message) {
		message = document.createElement("div");
		messages.appendChild(message);
		if ($data.id && $data.id !== "") {
			message.setAttribute("id", $data.id)
		}
	}
	message.innerHTML = $data.message || ".";
	messages.scrollTop = messages.scrollHeight - messages.clientHeight;
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
