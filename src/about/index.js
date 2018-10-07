const electron = require("electron");

electron.ipcRenderer.on("dom-ready", (_, $environment) => {
	updateInfo($environment);
	const action = document.getElementById("action");
	action.classList.add(process.platform);
	action.parentElement.classList.add(process.platform);
	action.addEventListener("click", () => electron.remote.getCurrentWindow().close());
});

electron.ipcRenderer.on("update-info", (_, $environment) => {
	updateInfo($environment);
});

function updateInfo($environment) {
	let packageJson = undefined;
	try {
		const path = require("path");
		packageJson = require(path.join(__dirname, "../../package.json"));
	}
	catch (error) {
		packageJson = {
			build: {}
		};
	}
	
	const logo = document.querySelector(".logo");
	logo.src = $environment.icon;
	logo.addEventListener("click", () => electron.shell.openExternal($environment.app.homepage || packageJson.homepage));

	document.title = "About " + ($environment.app.name || packageJson.productName);
	document.querySelector(".title").innerText = $environment.app.name || packageJson.productName;
	document.querySelector(".description").innerText = $environment.app.description || packageJson.description;
	document.querySelector(".version").innerText = "v" + ($environment.app.version || packageJson.version);
	document.querySelector(".copyright").innerHTML = ($environment.app.copyright || packageJson.build.copyright) + "<br/>Distributed under " + ($environment.app.license || packageJson.license) + " license";

	let frameworks = "";
	["electron", "chrome", "node", "v8"].forEach(name => frameworks += (frameworks != "" ? " - " : "") + name + " " + process.versions[name]);
	document.querySelector(".frameworks").innerHTML = "Powered by <b>" + ($environment.app.frameworks || packageJson.appFrameworks) + " - " + frameworks + "</b> and love from VIEApps.net";
}