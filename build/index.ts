import { type BuildOptions, build as esBuild, context as esContext } from "esbuild";

import { readFile } from "fs/promises";
import path from "path";

import { fileUrlPlugin } from "./plugins/fileUrl.js";
import { lunaNativePlugin } from "./plugins/lunaNativePlugin.js";
import { writeBundlePlugin } from "./plugins/writeBundlePlugin.js";

export const defaultBuildOptions: BuildOptions = {
	sourcemap: true,
	bundle: true,
	treeShaking: true,
	minify: true,
};

export const TidalNodeVersion = "node20.15"; // Tidal node version
export const TidalChromeVersion = "chrome126"; // Tidal target version

const externals = ["@luna/*", "oby", "react", "react-dom/client", "react/jsx-runtime", "electron"];

export const pluginBuildOptions = async (pluginPath: string, opts?: BuildOptions) => {
	const pluginPackage = await readFile(path.join(pluginPath, "package.json"), "utf8").then(JSON.parse);
	// Sanitize pluginPackage.name, remove @, replace / with .
	const safeName = pluginPackage.name.replace(/@/g, "").replace(/\//g, ".");
	return <BuildOptions>{
		...defaultBuildOptions,
		write: false,
		platform: "browser",
		target: TidalChromeVersion,
		format: "esm",
		outfile: `./dist/${safeName}.js`,
		entryPoints: ["./" + path.join(pluginPath, pluginPackage.main ?? pluginPackage.exports ?? "index.js")],
		...opts,
		external: [...(opts?.external ?? []), ...externals],
		plugins: [...(opts?.plugins ?? []), fileUrlPlugin, lunaNativePlugin, writeBundlePlugin(path.join(pluginPath, "package.json"))],
	};
};

/**
 * Overloads the given opts to use the logOutputPlugin and writeBundlePlugin
 */
export const makeBuildOpts = (opts: BuildOptions) => {
	try {
		const plugins = opts?.plugins ?? [];
		const hasWriteBundle = plugins.some((p) => p?.name === writeBundlePlugin().name);
		return <BuildOptions>{
			...defaultBuildOptions,
			...opts,
			write: false,
			plugins: hasWriteBundle ? plugins : [...plugins, writeBundlePlugin()],
		};
	} catch (err) {
		console.error(opts, err);
		throw err;
	}
};

export const build = (opts: BuildOptions[]) =>
	opts.map(makeBuildOpts).forEach(async (buildOptions: BuildOptions) => {
		esBuild(buildOptions).catch((err) => {
			console.error(buildOptions, err);
			throw err;
		});
	});

export const watch = (opts: BuildOptions[]) =>
	opts.map(makeBuildOpts).forEach(async (buildOptions: BuildOptions) => {
		const onErr = (err: Error) => {
			console.error(buildOptions, err);
			throw err;
		};
		const ctx = await esContext(buildOptions).catch(onErr);
		ctx.watch().catch(onErr);
	});

export const listen = process.argv.includes("--watch") ? watch : build;
