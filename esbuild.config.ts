import { makeBuildOpts, pluginBuildOptions, TidalNodeVersion } from "@luna/build";
import { build, context, type BuildOptions } from "esbuild";

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
						const outDir = dirname(outputFiles[1].path);
						await mkdir(outDir, { recursive: true });
						await writeFile(join(outDir, "package.json"), JSON.stringify({ main: basename(outputFiles[1].path) }));
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
	await pluginBuildOptions("./plugins/lib"),
	await pluginBuildOptions("./plugins/ui"),
];

const buildAll = () =>
	buildConfigs.map(async (opts: BuildOptions) => {
		const _opts = await makeBuildOpts(opts);
		build(_opts).catch((err) => {
			console.error(_opts, err);
			throw err;
		});
	});
const watchAll = () =>
	buildConfigs.map(async (opts: BuildOptions) => {
		const _opts = makeBuildOpts(opts);
		const onErr = (err) => {
			console.error(_opts, err);
			throw err;
		};
		const ctx = await context(_opts).catch(onErr);
		ctx.watch().catch(onErr);
	});

if (process.argv.includes("--watch")) watchAll();
else buildAll();
