import electron from "electron";
import Module from "module";

import { readFile } from "fs/promises";

import path from "path";

// #region Bundle
const localBundle = process.env.TIDALUNA_DIST_PATH;

// File paths
const preloadPath = path.join(localBundle ?? __dirname, "preload.js");
const bundlePath = path.join(localBundle ?? __dirname, "luna.js");

const loadLunaBundle = async (): Promise<string> => {
	const [js, map] = await Promise.all([readFile(bundlePath, "utf8"), readFile(`${bundlePath}.map`, "utf8")]);
	const base64Map = Buffer.from(map).toString("base64");
	return `${js}\n//# sourceMappingURL=data:application/json;base64,${base64Map}`;
};

// Safe handler to ensure no duplicates
const ipcHandle: (typeof Electron)["ipcMain"]["handle"] = (channel, listener) => {
	electron.ipcMain.removeAllListeners(channel);
	electron.ipcMain.handle(channel, listener);
};

// Prefetch luna js for when preload requests it
const lunaBundle = loadLunaBundle();
ipcHandle("__Luna.loadBundle", () => lunaBundle);
// #endregion

// Allow debugging from remote origins (e.g., Chrome DevTools over localhost)
// Requires starting client with --remote-debugging-port=9222
electron.app.commandLine.appendSwitch("remote-allow-origins", "http://localhost:9222");

// #region CSP/Script Prep
(async () => {
	// Ensure app is ready
	await electron.app.whenReady();

	// Bypass CSP
	electron.protocol.handle("https", async (req) => {
		const url = new URL(req.url);
		if (url.pathname === "/" || url.pathname == "/index.html") {
			const res = await electron.net.fetch(req, { bypassCustomProtocolHandlers: true });
			let body = await res.text();
			body = body.replace(
				/(<meta http-equiv="Content-Security-Policy")|(<script type="module" crossorigin src="(.*?)">)/g,
				(match, cspMatch, scriptMatch, src) => {
					if (cspMatch) {
						// Allow injecting our own scripts
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
		return electron.net.fetch(req, { bypassCustomProtocolHandlers: true });
	});

	// Force service worker to fetch resources by clearing it's cache.
	electron.session.defaultSession.clearStorageData({
		storages: ["cachestorage"],
	});
})();

// #region LunaNative handling
ipcHandle("__Luna.eval", (ev, code) => eval(code));
// #endregion

// #region Override electron.BrowserWindow
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
			// Store original preload and add a handle to fetch it later
			const origialPreload = options.webPreferences?.preload;
			ipcHandle("__Luna.originalPreload", () => origialPreload);

			// Replace the preload instead of using setPreloads because of some differences in internal behaviour.
			// Set preload script to Luna's
			options.webPreferences.preload = preloadPath;

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
