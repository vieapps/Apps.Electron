const path = require("path");
const electron = require("electron");

let homepageURI = "https://vieapps.net";

function updateInfo($environment) {
	let packageJson = undefined;
	try {
		packageJson = require(path.join(__dirname, "../../package.json"));
	}
	catch (error) {
		packageJson = {};
	}
	
	homepageURI = $environment.app.homepage || packageJson.homepage;
	let license = $environment.app.license || packageJson.license;
	license += license.indexOf("license") < 0 ? " license" : "";
	const name = $environment.app.name || packageJson.productName;
	const description = $environment.app.description || packageJson.description;
	const version = $environment.app.version || packageJson.version;
	const copyright = $environment.app.copyright || packageJson.copyright;
	let frameworks = "";
	["electron", "chrome", "node", "v8"].forEach(name => frameworks += (frameworks != "" ? " - " : "") + name + " " + process.versions[name]);
	frameworks = ($environment.app.frameworks || packageJson.frameworks) + " - " + frameworks;

	document.title = "About " + name;
	document.querySelector(".title").innerText = name;
	document.querySelector(".description").innerText = description;
	document.querySelector(".version").innerText = "v" + version;
	document.querySelector(".copyright").innerHTML = copyright + " - Distributed under " + license;
	document.querySelector(".frameworks").innerHTML = "Powered by <b>" + frameworks + "</b> and love from " + copyright.replace("©", "").trim();
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
