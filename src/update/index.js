window.app.on("dom-ready", $environment => {
	const action = document.getElementById("action");
	action.classList.add($environment.platform);
	action.parentElement.classList.add($environment.platform);
	action.addEventListener("click", () => {
		const state = document.getElementById("action").classList;
		if (state.contains("ready")) {
			window.app.send("app.updater", state.contains("can") ? "QuitAndInstall" : "Quit");
		}
		window.app.closeWindow();
	});
	document.getElementById("messages").style.height = (window.innerHeight - 80) + "px";
});

window.app.on("clear-messages", () => document.getElementById("messages").innerHTML = "");

window.app.on("add-message", $data => {
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

window.app.on("update-state", $state => {
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
