const desktop = window.desktopUI;

desktop.on("dom-ready", (_, $environment) => {
	const action = document.getElementById("action");
	action.classList.add($environment.platform);
	action.parentElement.classList.add($environment.platform);
	action.addEventListener("click", () => {
		const state = document.getElementById("action").classList;
		if (state.contains("ready")) {
			desktop.update( state.contains("can") ? "QuitAndInstall" : "Quit");
		}
		desktop.close();
	});
	document.getElementById("messages").style.height = (window.innerHeight - 80) + "px";
});

desktop.on("clear-messages", () => document.getElementById("messages").innerHTML = "");

desktop.on("add-message", (_, $data) => {
	const messages = document.getElementById("messages");
	let message = $data.id && $data.id !== "" ? document.getElementById($data.id) : undefined;
	if (!message) {
		message = document.createElement("div");
		messages.appendChild(message);
		if ($data.id && $data.id !== "") {
			message.setAttribute("id", $data.id)
		}
	}
	message.innerText = $data.message || ".";
	messages.scrollTop = messages.scrollHeight - messages.clientHeight;
});

desktop.on("update-state", (_, $state) => {
	const ready = $state !== undefined ? $state.ready : false;
	const canInstall = $state !== undefined ? $state.canInstall : false;
	const action = document.getElementById("action");
	action.innerText = ready
		? canInstall
			? "Install updates"
			: "Quit"
		: "Close";
	action.classList.toggle("ready", ready);
	action.classList.toggle("can", ready && canInstall);
});
