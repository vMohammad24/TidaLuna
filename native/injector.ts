import electron from "electron";
import Module from "module";

import { readdir, readFile } from "fs/promises";
import mime from "mime";

import path from "path";

// #region Bundle
const bundleDir = process.env.TIDALUNA_DIST_PATH ?? __dirname;

// Safe ipcHandler to ensure no duplicates
const ipcHandle: (typeof Electron)["ipcMain"]["handle"] = (channel, listener) => {
	electron.ipcMain.removeAllListeners(channel);
	electron.ipcMain.handle(channel, listener);
};
// #endregion

// Allow debugging from remote origins (e.g., Chrome DevTools over localhost)
// Requires starting client with --remote-debugging-port=9222
electron.app.commandLine.appendSwitch("remote-allow-origins", "http://localhost:9222");

// Preload bundle files for https://luna/
const bundleFiles: Record<string, [Buffer, ResponseInit]> = {};
readdir(bundleDir).then((files) => {
	files.forEach(async (file) => {
		bundleFiles[`https://luna/${file}`] = [await readFile(path.join(bundleDir, file)), { headers: { "Content-Type": mime.getType(file) } }];
	});
});
// #region CSP/Script Prep
// Ensure app is ready
electron.app.whenReady().then(async () => {
	electron.protocol.handle("https", async (req) => {
		// Espose bundle files under https://luna/
		if (bundleFiles[req.url]) return new Response(...bundleFiles[req.url]);

		// Bypass CSP & Mark meta scripts for quartz injection
		if (req.url === "https://desktop.tidal.com/") {
			const res = await electron.net.fetch(req, { bypassCustomProtocolHandlers: true });
			let body = await res.text();
			body = body.replace(
				/(<meta http-equiv="Content-Security-Policy")|(<script type="module" crossorigin src="(.*?)">)/g,
				(match, cspMatch, scriptMatch, src) => {
					if (cspMatch) {
						// Remove CSP
						return `<meta name="LunaWuzHere"`;
					} else if (scriptMatch) {
						// Mark module scripts for quartz injection
						return `<script type="luna/quartz" src="${src}">`;
					}
					// Should not happen if the regex is correct
					return match;
				},
			);
			return new Response(body, res);
		}
		// All other requests passthrough
		return electron.net.fetch(req, { bypassCustomProtocolHandlers: true });
	});

	// Force service worker to fetch resources by clearing it's cache.
	electron.session.defaultSession.clearStorageData({
		storages: ["cachestorage"],
	});
});

// #region LunaNative handling
// Call to register native module
ipcHandle("__Luna.registerNative", async (ev, name: string, code: string) => {
	// Load module
	const exports = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
	const channel = `__${name}`;
	// Register handler for calling module exports
	electron.ipcMain.removeHandler(channel);
	electron.ipcMain.handle(channel, async (_, exportName, ...args) => {
		try {
			return await exports[exportName](...args);
		} catch (err) {
			// Set cause to identify native module
			err.cause = `[Luna.native].${name}.${exportName}`;
			throw err;
		}
	});
});
// #endregion

// #region Override electron.BrowserWindow to allow setting custom options
const ProxiedBrowserWindow = new Proxy(electron.BrowserWindow, {
	construct(target, args) {
		const options = args[0];

		// Improve memory limits
		options.webPreferences.nodeOptions = "--max-old-space-size=8192";
		// Ensure smoothScrolling is always enabled
		options.webPreferences.smoothScrolling = true;

		// tidal-hifi does not set the title, rely on dev tools instead.
		const isTidalWindow = options.title == "TIDAL" || options.webPreferences?.devTools;
		if (isTidalWindow) {
			// Store original preload and add a handle to fetch it later (see ./preload.ts)
			const origialPreload = options.webPreferences?.preload;
			ipcHandle("__Luna.originalPreload", () => origialPreload);

			// Replace the preload instead of using setPreloads because of some differences in internal behaviour.
			// Set preload script to Luna's
			options.webPreferences.preload = path.join(bundleDir, "preload.js");

			// TODO: Find why sandboxing has to be disabled
			options.webPreferences.sandbox = false;

			// Allow loading and display of http content if in a dev env
			if (process.env.TIDALUNA_ALLOW_INSECURE_CONTENT) {
				options.webPreferences.allowDisplayingInsecureContent = true;
				options.webPreferences.allowRunningInsecureContent = true;
			}
		}
		return new target(options);
	},
});

// Replace the default electron BrowserWindow with our proxied one
const electronPath = require.resolve("electron");
delete require.cache[electronPath].exports;
require.cache[electronPath].exports = {
	...electron,
	BrowserWindow: ProxiedBrowserWindow,
};
// #endregion

// #region Restore DevTools
const originalBuildFromTemplate = electron.Menu.buildFromTemplate;
electron.Menu.buildFromTemplate = (template) => {
	template.push({
		role: "toggleDevTools",
		visible: false,
	});
	return originalBuildFromTemplate(template);
};
// #endregion

// #region Start original app
const tidalAppPath = path.join(process.resourcesPath, "original.asar");
const tidalPackage = require(path.resolve(path.join(tidalAppPath, "package.json")));
const startPath = path.join(tidalAppPath, tidalPackage.main);

require.main.filename = startPath;
// @ts-expect-error This exists?
electron.app.setAppPath?.(tidalAppPath);
electron.app.name = tidalPackage.name;

// @ts-expect-error Call Module._load instead of require to bypass internal checks
Module._load(startPath, null, true);
// #endregion
