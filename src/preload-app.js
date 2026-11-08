const { contextBridge, ipcRenderer } = require("electron");

// Preserve the subset of ngx-electron used by the existing compiled app.
// The actual Electron object, IpcRendererEvent and Node require stay isolated.
const listeners = new Map();
const bridge = {
	ipcRenderer: {
		send(channel, payload) {
			if (!["App", "Users"].includes(channel)) throw new Error("Unsupported app channel");
			ipcRenderer.send(channel, payload);
		},
		on(channel, callback) {
			if (channel !== "electron.ipc2app" || typeof callback !== "function") throw new Error("Unsupported app subscription");
			const listener = (_, payload) => callback({}, payload);
			const entries = listeners.get(callback) || [];
			entries.push(listener);
			listeners.set(callback, entries);
			ipcRenderer.on(channel, listener);
			return () => {
				ipcRenderer.removeListener(channel, listener);
				const active = listeners.get(callback) || [];
				const remaining = active.filter(entry => entry !== listener);
				if (remaining.length) listeners.set(callback, remaining);
				else listeners.delete(callback);
			};
		},
		removeListener(channel, callback) {
			if (channel !== "electron.ipc2app") throw new Error("Unsupported app subscription");
			const entries = listeners.get(callback) || [];
			const listener = entries.pop();
			if (listener) ipcRenderer.removeListener(channel, listener);
			if (!entries.length) listeners.delete(callback);
		}
	},
	shell: { openExternal: url => ipcRenderer.invoke("app.openExternal", url) }
};

contextBridge.exposeInMainWorld("vieappsDesktop", bridge);
contextBridge.exposeInMainWorld("require", name => {
	if (name !== "electron") throw new Error("Only the Electron compatibility bridge is available");
	return bridge;
});
contextBridge.exposeInMainWorld("process", { platform: process.platform, arch: process.arch });
