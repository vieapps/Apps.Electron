const desktop = window.desktopUI;
let homepageURI = "https://vieapps.net";

function updateInfo(info) {
	const app = info.app;
	homepageURI = app.homepage;
	const license = app.license || "Apache-2.0";
	const versions = ["electron", "chrome", "node", "v8"].map(name => name + " " + info.versions[name]).join(" - ");
	document.title = "About " + app.name;
	document.querySelector(".title").innerText = app.name;
	document.querySelector(".description").innerText = app.description;
	document.querySelector(".version").innerText = "v" + app.version;
	document.querySelector(".copyright").innerText = app.copyright + " - Distributed under " + license + (license.includes("license") ? "" : " license");
	document.querySelector(".frameworks").innerText = "Powered by " + (app.frameworks ? app.frameworks + " - " : "") + versions + " and love from " + app.copyright.replace("©", "").trim();
}

desktop.on("dom-ready", (_, info) => {
	const logo = document.querySelector(".logo");
	logo.src = info.icon;
	logo.addEventListener("click", () => desktop.openExternal(homepageURI).catch(console.error));
	const action = document.getElementById("action");
	action.classList.add(info.platform);
	action.parentElement.classList.add(info.platform);
	action.addEventListener("click", () => desktop.close());
	document.getElementById("info").style.height = (window.innerHeight - 80) + "px";
	updateInfo(info);
});

desktop.on("update-info", (_, info) => updateInfo(info));
