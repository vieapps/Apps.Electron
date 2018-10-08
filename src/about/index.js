const path = require("path");
const electron = require("electron");

let homepageURI = "https://vieapps.net";

function updateInfo($environment) {
	let packageJson = undefined;
	try {
		packageJson = require(path.join(__dirname, "../../package.json"));
	}
	catch (error) {
		packageJson = {
			build: {}
		};
	}
	
	homepageURI = $environment.app.homepage || packageJson.homepage;
	const name = $environment.app.name || packageJson.productName;
	document.title = "About " + name;

	document.querySelector(".title").innerText = name;
	document.querySelector(".description").innerText = $environment.app.description || packageJson.description;
	document.querySelector(".version").innerText = "v" + ($environment.app.version || packageJson.version);
	document.querySelector(".copyright").innerHTML = ($environment.app.copyright || packageJson.build.copyright) + "<br/>Distributed under " + ($environment.app.license || packageJson.license) + " license";

	let frameworks = "";
	["electron", "chrome", "node", "v8"].forEach(name => frameworks += (frameworks != "" ? " - " : "") + name + " " + process.versions[name]);
	document.querySelector(".frameworks").innerHTML = "Powered by <b>" + ($environment.app.frameworks || packageJson.appFrameworks) + " - " + frameworks + "</b> and love from VIEApps.net";
}

electron.ipcRenderer.on("dom-ready", (_, $environment) => {
	const logo = document.querySelector(".logo");
	logo.src = $environment.icon;
	logo.addEventListener("click", () => electron.shell.openExternal(homepageURI));
	const action = document.getElementById("action");
	action.classList.add(process.platform);
	action.parentElement.classList.add(process.platform);
	action.addEventListener("click", () => electron.remote.getCurrentWindow().close());
	document.getElementById("info").style.height = (window.innerHeight - 80) + "px";
	updateInfo($environment);
});

electron.ipcRenderer.on("update-info", (_, $environment) => updateInfo($environment));
