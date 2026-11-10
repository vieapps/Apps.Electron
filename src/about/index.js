let homepageURL = "https://vieapps.net";

function updateInfo($environment) {
	const packageJson = $environment.package || {};

	homepageURL = $environment.app.homepage || packageJson.homepage;
	let license = $environment.app.license || packageJson.license;
	license += license.indexOf("license") < 0 ? " license" : "";
	const name = $environment.app.name || packageJson.productName;
	const description = $environment.app.description || packageJson.description;
	const version = $environment.app.version || packageJson.version;
	const copyright = $environment.app.copyright || packageJson.copyright;
	let frameworks = "";
	["electron", "chrome", "node", "v8"].forEach(name => frameworks += (frameworks != "" ? " - " : "") + name + " " + $environment.versions[name]);
	frameworks = ($environment.app.frameworks || packageJson.frameworks) + " - " + frameworks;

	document.title = "About " + name;
	document.querySelector(".title").innerText = name;
	document.querySelector(".description").innerText = description;
	document.querySelector(".version").innerText = "v" + version;
	document.querySelector(".copyright").innerHTML = copyright + " - Distributed under " + license;
	document.querySelector(".frameworks").innerHTML = "Powered by <b>" + frameworks + "</b> and love from " + copyright.replace("©", "").trim();
}

window.app.on("dom-ready", $environment => {
	const logo = document.querySelector(".logo");
	logo.src = $environment.icon;
	logo.addEventListener("click", () => window.app.openExternal(homepageURL));
	const action = document.getElementById("action");
	action.classList.add($environment.platform);
	action.parentElement.classList.add($environment.platform);
	action.addEventListener("click", () => window.app.closeWindow());
	document.getElementById("info").style.height = (window.innerHeight - 80) + "px";
	updateInfo($environment);
});

window.app.on("update-info", $environment => updateInfo($environment));
