const electron = require("electron");
let updateIsReady = false;

electron.ipcRenderer.on("window.update", ($event, $info) => {
	if ("dom-ready" === $info.type) {
		document.getElementById("version").innerText = "v" + $info.environment.app.version;
		const button = document.getElementById("action");
		button.classList.add("false");
		button.addEventListener("click", () => {
			if (updateIsReady) {
				electron.ipcRenderer.send("autoUpdater", { request: "QuitAndInstall" });
			}
			electron.remote.getCurrentWindow().close();
		});
	}
	else if ("message" === $info.type) {
		const message = document.createElement("div");
		message.innerHTML = $info.message;
		document.getElementById("messages").appendChild(message);
	}
	else if ("clear" === $info.type) {
		document.getElementById("messages").innerHTML = "";
	}
	else if ("ready" === $info.type) {
		updateIsReady = true;
		const button = document.getElementById("action");
		button.innerText = "Install updates";
		button.classList.remove("false");
		button.classList.add("true");
	}
});