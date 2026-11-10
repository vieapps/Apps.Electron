// preload script: the only bridge between the main process and the renderer pages (contextIsolation + sandbox).
// only whitelisted IPC channels are exposed, the renderer never gets access to Node.js or to the full ipcRenderer.
const { contextBridge, ipcRenderer } = require("electron");

// channels: renderer -> main
const sendChannels = ["App", "Users", "app.updater"];

// channels: main -> renderer
const receiveChannels = ["dom-ready", "update-info", "clear-messages", "add-message", "update-state", "electron.ipc2app"];

const listeners = new Map();

function send(channel, data) {
	if (!sendChannels.includes(channel)) {
		throw new Error("IPC channel is not allowed: " + channel);
	}
	ipcRenderer.send(channel, data);
}

function on(channel, listener) {
	if (!receiveChannels.includes(channel)) {
		throw new Error("IPC channel is not allowed: " + channel);
	}
	const handler = (_, data) => listener(data);
	listeners.set(listener, handler);
	ipcRenderer.on(channel, handler);
}

function off(channel, listener) {
	const handler = listeners.get(listener);
	if (handler !== undefined) {
		ipcRenderer.removeListener(channel, handler);
		listeners.delete(listener);
	}
}

// bridges for the hosted apps
const bridge = {
	ipcRenderer: {
		send: (channel, args) => send(channel, args),
		on: (channel, listener) => on(channel, data => listener({}, data)),
		off: (channel, listener) => off(channel, data => listener({}, data))
	},
	shell: {
		closeWindow: () => ipcRenderer.send("window.close"),
		openExternal: url => ipcRenderer.send("shell.openExternal", String(url))
	}
};
contextBridge.exposeInMainWorld("bridge", bridge);
contextBridge.exposeInMainWorld("app", Object.assign({}, bridge, {
	process: process,
	send: send,
	on: on,
	off: off,
	closeWindow: () => ipcRenderer.send("window.close"),
	openExternal: url => ipcRenderer.send("shell.openExternal", String(url))
}));