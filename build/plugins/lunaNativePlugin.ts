import { build, Plugin } from "esbuild";
import { resolve } from "path";
import { pathToFileURL } from "url";
import { defaultBuildOptions, TidalNodeVersion } from "../index.js";
import { fileUrlPlugin } from "./fileUrl.js";
import { buildCache } from "./outputCache.js";

const buildOutput = buildCache(async (args) => {
	// Resolve the absolute path and convert it to a file URL
	const entryPath = resolve(args.path);
	const entryUrl = pathToFileURL(entryPath).toString();

	const { outputFiles, metafile } = await build({
		...defaultBuildOptions,
		entryPoints: [args.path],
		write: false,
		metafile: true,
		sourcemap: false,
		platform: "node",
		target: TidalNodeVersion, // Tidal node version
		format: "esm",
		external: ["@luna/*", "electron"],
		plugins: [fileUrlPlugin],
		banner: {
			// Support require for native modules
			js: `import { createRequire } from 'module';const require = createRequire(${JSON.stringify(entryUrl)})`,
		},
	});

	const output = Object.values(metafile!.outputs)[0];

	// Try sanitize entry path to remove plugins/ prefix
	const entryPoint = output.entryPoint?.replace("plugins/", "");

	return {
		contents: `
		// Register the native module code, see native/injector.ts
		const channel = await lunaNative.invoke("__Luna.registerNative", "${entryPoint}", ${JSON.stringify(outputFiles![0].text)});

		// Expose built exports to plugin
		${output.exports
			.map((_export) => {
				return `export ${_export === "default" ? "default" : `const ${_export}`} = (...args) => lunaNative.invoke(channel, "${_export}", ...args);`;
			})
			.join("\n")}
	`,
	};
});
export const lunaNativePlugin: Plugin = {
	name: "lunaNativePlugin",
	setup(build) {
		build.onLoad({ filter: /.*\.native\.[a-z]+/ }, buildOutput);
	},
};
