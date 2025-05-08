import { type BuildOptions, type PluginBuild } from "esbuild";
import { listen, TidalNodeVersion } from "luna/build";

import { mkdir, readFile, writeFile } from "fs/promises";

const packageJsonPlugin = {
	name: "write-package-json",
	setup(build: PluginBuild) {
		build.onEnd(async () => {
			await mkdir("./dist", { recursive: true });
			await writeFile("./dist/package.json", await readFile("./package.json", "utf-8"));
		});
	},
};

const buildConfigs: BuildOptions[] = [
	{
		entryPoints: ["native/injector.ts"],
		outfile: "dist/injector.mjs",
		target: TidalNodeVersion,
		format: "esm",
		platform: "node",
		external: ["electron", "module"],
		plugins: [packageJsonPlugin],
	},
	{
		entryPoints: ["native/preload.ts"],
		outfile: "dist/preload.mjs",
		platform: "node",
		target: TidalNodeVersion,
		format: "esm",
		external: ["electron"],
		plugins: [packageJsonPlugin],
	},
	{
		entryPoints: ["render/src/index.ts"],
		outfile: "dist/luna.mjs",
		target: TidalNodeVersion,
		platform: "browser",
		format: "esm",
	},
];

import "build/buildPlugins";
listen(buildConfigs);
