import { contextBridge, ipcRenderer, webFrame } from "electron";

// Allow render side to execute invoke
contextBridge.exposeInMainWorld("lunaNative", {
	invoke: ipcRenderer.invoke,
});

const loadLunaFile = async (fileName: string) => {
	await webFrame.executeJavaScript(`(async () => { await import("lu://luna/${fileName}"); })()`, true).catch((err) => {
		console.error(`[Luna.preload] ${fileName} failed to load!`, err);
		throw err;
	});
	console.log(`[Luna.preload] ${fileName} loaded!`);
};

// require() the original Tidal preload script
ipcRenderer.invoke("__Luna.originalPreload").then(require);

// Load the luna.js renderer code
loadLunaFile("luna.js");
