const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopUI", {
	on(channel, callback) {
		if (!["dom-ready", "update-info", "clear-messages", "add-message", "update-state"].includes(channel)
			|| typeof callback !== "function") throw new Error("Unsupported UI subscription");
		const listener = (_, payload) => callback({}, payload);
		ipcRenderer.on(channel, listener);
		return () => ipcRenderer.removeListener(channel, listener);
	},
	close: () => ipcRenderer.send("app.window.close"),
	openExternal: url => ipcRenderer.invoke("app.openExternal", url),
	update(request) {
		if (!["Quit", "QuitAndInstall"].includes(request)) throw new Error("Unsupported updater request");
		ipcRenderer.send("app.updater", request);
	}
});
