import { contextBridge, ipcRenderer, webFrame } from "electron";

// Allow render side to execute invoke
contextBridge.exposeInMainWorld("lunaNative", {
	invoke: ipcRenderer.invoke,
});

// require() the original Tidal preload script
ipcRenderer.invoke("__Luna.originalPreload").then(require);

// Load the luna.js renderer code
(async () => {
	await webFrame
		.executeJavaScript(
			`(async () => { await import(URL.createObjectURL(new Blob([await lunaNative.invoke("__Luna.renderJs")], { type: "text/javascript" }))) })()`,
			true,
		)
		.catch((err) => {
			console.error(`[Luna.preload] luna.js failed to load!`, err);
			throw err;
		});
	console.log(`[Luna.preload] luna.js loaded!`);
})();
