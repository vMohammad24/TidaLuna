import { type BuildOptions } from "esbuild";
import { listen, TidalNodeVersion } from "luna/build";

import { mkdir, writeFile } from "fs/promises";
import { basename, dirname, join } from "path";

const buildConfigs: BuildOptions[] = [
	{
		entryPoints: ["native/injector.ts"],
		outfile: "dist/injector.js",
		format: "cjs",
		platform: "node",
		external: ["electron", "module"],
		plugins: [
			{
				name: "write-package-json",
				setup(build) {
					build.onEnd(async ({ outputFiles }) => {
						const path = outputFiles![1].path;
						const outDir = dirname(path);
						await mkdir(outDir, { recursive: true });
						await writeFile(join(outDir, "package.json"), JSON.stringify({ main: basename(path) }));
					});
				},
			},
		],
	},
	{
		entryPoints: ["native/preload.ts"],
		outfile: "dist/preload.js",
		platform: "node",
		target: TidalNodeVersion,
		format: "cjs",
		external: ["electron"],
	},
	{
		entryPoints: ["render/src/index.ts"],
		outfile: "dist/luna.js",
		target: TidalNodeVersion,
		platform: "browser",
		format: "esm",
	},
];

import "build/buildPlugins";
listen(buildConfigs);
