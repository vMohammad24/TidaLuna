import type { AnyFn } from "@inrixia/helpers";
import { contextBridge, ipcRenderer, webFrame } from "electron";
import { createRequire } from "module";

// Allow render side to execute invoke
contextBridge.exposeInMainWorld("ipcRenderer", {
	invoke: ipcRenderer.invoke,
	send: ipcRenderer.send,
	on: (channel: string, listener: AnyFn) => {
		const ipcListener = (_: Electron.IpcRendererEvent, ...args: any[]) => listener(...args);
		ipcRenderer.on(channel, ipcListener);
		const unload = () => ipcRenderer.removeListener(channel, ipcListener);
		unload.source = `ipcRenderer.on("${channel}")`;
		return unload;
	},
	once: (channel: string, listener: AnyFn) => {
		const ipcListener = (_: Electron.IpcRendererEvent, ...args: any[]) => listener(...args);
		ipcRenderer.once(channel, ipcListener);
		const unload = () => ipcRenderer.removeListener(channel, ipcListener);
		unload.source = `ipcRenderer.once("${channel}")`;
		return unload;
	},
});

type ConsoleMethodName = {
	[K in keyof Console]: Console[K] extends (...args: any[]) => any ? K : never;
}[keyof Console];
ipcRenderer.on("__Luna.console", (_event, prop: ConsoleMethodName, args: any[]) => {
	try {
		console[prop].apply(console, args);
	} catch (e) {
		console.error("[Luna.native]", "Failed to forward console to renderer", e, args);
	}
});

// Load the luna.js renderer code and store it in window.luna.core
(async () => {
	const originalConsole = { ...console };
	await webFrame
		.executeJavaScript(
			`(async () => { 
				try {
					const renderJs = await ipcRenderer.invoke("__Luna.renderJs");
					const renderUrl = URL.createObjectURL(new Blob([renderJs], { type: "text/javascript" }));
					window.luna ??= {};
					window.luna.core = await import(renderUrl);
					window.luna.core.modules["@luna/core"] = window.luna.core;
				} catch (err) {
					setTimeout(() => {
						// Created in native/injector.ts
						const messageContainer = document.getElementById('tidaluna-loading-text');
						if (messageContainer !== null) {
							messageContainer.innerHTML += \`
							<h2>Failed to load luna.js</h2><br/>
							<span style="color: red">\${err.message}</span><br/><br/>
							<span>\${err.stack}</span>\`;
						}
					});
					throw err;
				}
			})()`,
			true,
		)
		.catch((err) => {
			console.error(`[Luna.preload] luna.js failed to load!`, err);
			throw err;
		});
	// Undo any console fuckery that tidal does
	console = originalConsole;
	console.log(`[Luna.preload] luna.js loaded!`);
})();

// require() the original Tidal preload script
ipcRenderer.invoke("__Luna.originalPreload").then(createRequire(import.meta.url));
