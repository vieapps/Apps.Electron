// main components
const path = require("path")
const electron = require("electron");

electron.ipcRenderer.on("window.about", ($event, $info) => {
	if ("dom-ready" === $info.type) {
		let homepageURI = $info.homepageURI;
		let appFrameworks = undefined;
		try {
			const info = require(path.join(__dirname, "../../package.json"));
			document.title = "About " + info.productName;
			document.querySelector(".title").innerText = info.productName;
			document.querySelector(".description").innerText = info.description;
			document.querySelector(".version").innerText = "v" + info.version;
			document.querySelector(".copyright").innerHTML = (info.build && info.build.copyright ? info.build.copyright : $info.copyright) + ((info.license || $info.license) ? "<br/>Distributed under " + (info.license || $info.license) + " license" : "");
			appFrameworks = info.appFrameworks || $info.appFrameworks;
			if (!homepageURI) {
				homepageURI = info.homepage;
			}
		}
		catch (error) {}
	
		let frameworks = "";
		["electron", "chrome", "node", "v8"].forEach(name => frameworks += (frameworks != "" ? " - " : "") + name + " " + process.versions[name]);
		document.querySelector(".frameworks").innerHTML = "Powered by <b>" + (appFrameworks ? appFrameworks + " - " : "") + frameworks + "</b> and love from VIEApps.net";

		const window = electron.remote.getCurrentWindow();
		document.querySelector(".button").addEventListener("click", () => window.close());
		
		const logo = document.querySelector(".logo");
		logo.src = $info.logoURI || $info.environment.icon;
		logo.addEventListener("click", () => electron.shell.openExternal(homepageURI));

		if ($info.environment.openDevTools) {
			window.webContents.openDevTools({ mode: "detach" });
		}
	}
});