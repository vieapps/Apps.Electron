const electron = require("electron");
electron.ipcRenderer.on("window.about", ($event, $info) => {
	if ("dom-ready" === $info.type) {
		let pkginfo = undefined;
		try {
			const path = require("path");
			pkginfo = require(path.join(__dirname, "../../package.json"));
		}
		catch (error) {
			pkginfo = {
				build: {}
			};
		}

		document.title = "About " + ($info.environment.app.name || pkginfo.productName);
		document.querySelector(".title").innerText = $info.environment.app.name || pkginfo.productName;
		document.querySelector(".description").innerText = $info.environment.app.description || pkginfo.description;
		document.querySelector(".version").innerText = "v" + ($info.environment.app.version || pkginfo.version);
		document.querySelector(".copyright").innerHTML = ($info.environment.app.copyright || pkginfo.build.copyright) + "<br/>Distributed under " + ($info.environment.app.license || pkginfo.license) + " license";

		let frameworks = "";
		["electron", "chrome", "node", "v8"].forEach(name => frameworks += (frameworks != "" ? " - " : "") + name + " " + process.versions[name]);
		document.querySelector(".frameworks").innerHTML = "Powered by <b>" + ($info.environment.app.frameworks || pkginfo.appFrameworks) + " - " + frameworks + "</b> and love from VIEApps.net";

		const window = electron.remote.getCurrentWindow();
		document.querySelector(".button").addEventListener("click", () => window.close());
		
		const logo = document.querySelector(".logo");
		logo.src = $info.environment.icon;
		logo.addEventListener("click", () => electron.shell.openExternal($info.environment.app.homepageURI || pkginfo.homepage));

		if ($info.environment.app.openDevTools) {
			window.webContents.openDevTools({ mode: "detach" });
		}
	}
});