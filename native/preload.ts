import { contextBridge, ipcRenderer, webFrame } from "electron";

// Allow render side to execute invoke
contextBridge.exposeInMainWorld("lunaNative", {
	invoke: ipcRenderer.invoke,
});

// require() the original Tidal preload script
ipcRenderer.invoke("__Luna.originalPreload").then(require);

// Load the luna.js renderer code and store it in window.luna.core
(async () => {
	await webFrame
		.executeJavaScript(
			`(async () => { 
				const renderJs = await lunaNative.invoke("__Luna.renderJs");
				const renderUrl = URL.createObjectURL(new Blob([renderJs], { type: "text/javascript" }));
				window.luna = {};
				window.luna.core = await import(renderUrl);
			})()`,
			true,
		)
		.catch((err) => {
			console.error(`[Luna.preload] luna.js failed to load!`, err);
			throw err;
		});
	console.log(`[Luna.preload] luna.js loaded!`);
})();
