import electron from "electron";
import Module from "module";

import { readFile } from "fs/promises";
import mime from "mime";

import path from "path";

// #region Bundle
const bundleDir = process.env.TIDALUNA_DIST_PATH ?? __dirname;

// Safe ipcHandler to ensure no duplicates
const ipcHandle: (typeof Electron)["ipcMain"]["handle"] = (channel, listener) => {
	electron.ipcMain.removeHandler(channel);
	electron.ipcMain.handle(channel, listener);
};
// #endregion

// Allow debugging from remote origins (e.g., Chrome DevTools over localhost)
// Requires starting client with --remote-debugging-port=9222
electron.app.commandLine.appendSwitch("remote-allow-origins", "http://localhost:9222");

const bundleFile = async (url: string): Promise<[Buffer, ResponseInit]> => {
	const fileName = url.slice(13);
	// Eh, can already use native to touch fs dont stress escaping bundleDir
	const filePath = path.join(bundleDir, fileName);
	let content = await readFile(filePath);

	// If JS file, check for .map and append if exists
	if (fileName.endsWith(".js")) {
		const mapPath = filePath + ".map";
		try {
			// Append base64 encoded source map to the end of the file
			const base64Map = Buffer.from(await readFile(mapPath, "utf8")).toString("base64");
			const sourceMapComment = `\n//# sourceURL=${url}\n//# sourceMappingURL=data:application/json;base64,${base64Map}`;
			content = Buffer.concat([content, Buffer.from(sourceMapComment, "utf8")]);
		} catch {
			// .map file does not exist, do nothing
		}
	}
	return [content, { headers: { "Content-Type": mime.getType(fileName)! } }];
};

// Preload bundle files for https://luna/
const lunaBundle = bundleFile("https://luna/luna.js").then(([content]) => content);
ipcHandle("__Luna.renderJs", () => lunaBundle);

// #region CSP/Script Prep
// Ensure app is ready
electron.app.whenReady().then(async () => {
	electron.protocol.handle("https", async (req) => {
		if (req.url.startsWith("https://luna/")) {
			try {
				return new Response(...(await bundleFile(req.url)));
			} catch (err: any) {
				return new Response(err.message, { status: err.message.startsWith("ENOENT") ? 404 : 500, statusText: err.message });
			}
		}
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
			// Add loading text to the body
			body = body.replace(
				/<body(.*?)>/i,
				`<body$1><div id="tidaluna-loading" style="position: absolute; z-index: -1; top: 20%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; text-align: center; opacity: 1; transition: opacity 1s ease-out;">
					<h1>Loading Tida<b><span style="color: #31d8ff;">Luna</span></b>...</h1>
					<div id="tidaluna-loading-text" style="position: absolute; top: 100%;"></div>
				</div>`,
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
	const channel = `__LunaNative.${name}`;
	// Register handler for calling module exports
	ipcHandle(channel, async (_, exportName, ...args) => {
		try {
			return await exports[exportName](...args);
		} catch (err: any) {
			// Set cause to identify native module
			err.cause = `[Luna.native].${name}.${exportName}`;
			throw err;
		}
	});
	return channel;
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
delete require.cache[electronPath]!.exports;
require.cache[electronPath]!.exports = {
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

require.main!.filename = startPath;
// @ts-expect-error This exists?
electron.app.setAppPath?.(tidalAppPath);
electron.app.name = tidalPackage.name;

// @ts-expect-error Call Module._load instead of require to bypass internal checks
Module._load(startPath, null, true);
// #endregion
