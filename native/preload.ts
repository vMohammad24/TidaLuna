import { unloadableEmitter, type AnyFn } from "@inrixia/helpers";
import { contextBridge, ipcRenderer, webFrame } from "electron";
import { createRequire } from "module";

const ipcRendererUnloadable = unloadableEmitter(ipcRenderer, null, "ipcRenderer");

// Allow render side to execute invoke
contextBridge.exposeInMainWorld("__ipcRenderer", {
	invoke: ipcRenderer.invoke,
	send: ipcRenderer.send,
	on: (channel: string, listener: AnyFn) => ipcRendererUnloadable.onU(null, channel, (_, ...args) => listener(...args)),
	once: (channel: string, listener: AnyFn) => ipcRendererUnloadable.onceU(null, channel, (_, ...args) => listener(...args)),
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
	await webFrame
		.executeJavaScript(
			`(async () => {
				const originalConsole = { ...console };
				try {
					const renderJs = await __ipcRenderer.invoke("__Luna.renderJs");
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
					console.error(err);
					throw new Error("[Luna.preload] Failed to load luna.js");
				} finally {
				 	// Undo any console fuckery that tidal does
					window.console = globalThis.console = console = originalConsole;
				}
			})()`,
			true,
		)
		.catch((err) => {
			console.error(`[Luna.preload] luna.js failed to load!`, err);
			throw err;
		});
	console.log(`[Luna.preload] luna.js loaded!`);
})();

// require() the original Tidal preload script
ipcRenderer.invoke("__Luna.originalPreload").then(createRequire(import.meta.url));
