import { build, context, pluginBuildOptions, TidalNodeVersion, type BuildOptions } from "@luna/build";
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

const buildAll = () => buildConfigs.map(build);
const watchAll = () => buildConfigs.map(async (opts) => (await context(opts)).watch());

if (process.argv.includes("--watch")) watchAll();
else buildAll();
