const electron = require("electron");

electron.ipcRenderer.on("dom-ready", (_, $environment) => {
	let package = undefined;
	try {
		const path = require("path");
		package = require(path.join(__dirname, "../../package.json"));
	}
	catch (error) {
		package = {
			build: {}
		};
	}
	
	const logo = document.querySelector(".logo");
	logo.src = $environment.icon;
	logo.addEventListener("click", () => electron.shell.openExternal($environment.app.homepageURI || package.homepage));

	document.title = "About " + ($environment.app.name || package.productName);
	document.querySelector(".title").innerText = $environment.app.name || package.productName;
	document.querySelector(".description").innerText = $environment.app.description || package.description;
	document.querySelector(".version").innerText = "v" + ($environment.app.version || package.version);
	document.querySelector(".copyright").innerHTML = ($environment.app.copyright || package.build.copyright) + "<br/>Distributed under " + ($environment.app.license || package.license) + " license";

	let frameworks = "";
	["electron", "chrome", "node", "v8"].forEach(name => frameworks += (frameworks != "" ? " - " : "") + name + " " + process.versions[name]);
	document.querySelector(".frameworks").innerHTML = "Powered by <b>" + ($environment.app.frameworks || package.appFrameworks) + " - " + frameworks + "</b> and love from VIEApps.net";

	document.querySelector(".button").addEventListener("click", () => electron.remote.getCurrentWindow().close());
});