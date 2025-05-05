import { build, Plugin } from "esbuild";
import { defaultBuildOptions, TidalNodeVersion } from "../index";
import { fileUrlPlugin } from "./fileUrl";
import { buildCache } from "./outputCache";

const buildOutput = buildCache(async (args) => {
	const { outputFiles, metafile } = await build({
		...defaultBuildOptions,
		entryPoints: [args.path],
		write: false,
		metafile: true,
		sourcemap: false,
		platform: "node",
		target: TidalNodeVersion, // Tidal node version
		format: "esm",
		external: ["@luna/*", "electron", "./original.asar/*"],
		plugins: [fileUrlPlugin],
	});

	const output = Object.values(metafile!.outputs)[0];

	// Try sanitize entry path to remove plugins/ prefix
	const entryPoint = output.entryPoint?.replace("plugins/", "");

	return {
		contents: `
		// Register the native module code, see native/injector.ts
		const channel = await __ipcRenderer.invoke("__Luna.registerNative", "${entryPoint}", ${JSON.stringify(outputFiles![0].text)});

		// Expose built exports to plugin
		${output.exports
			.map((_export) => {
				return `export ${_export === "default" ? "default" : `const ${_export}`} = (...args) => __ipcRenderer.invoke(channel, "${_export}", ...args);`;
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
