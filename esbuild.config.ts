import { context, build as esbuildBuild, type BuildOptions } from "esbuild";
import { writeFileSync } from "fs";
import { dirname, join } from "path";

const buildConfigs: BuildOptions[] = [
	{
		entryPoints: ["render/src/index.ts"],
		outfile: "dist/luna.js",
		bundle: true,
		format: "iife",
		sourcemap: true,
		minify: true,
	},
	{
		entryPoints: ["native/src/injector.ts"],
		outfile: "dist/injector.js",
		bundle: true,
		format: "cjs",
		platform: "node",
		sourcemap: true,
		minify: true,
		external: ["electron", "module"],
		plugins: [
			{
				name: "write-package-json",
				setup(build) {
					build.onEnd(() => {
						writeFileSync(join(dirname("dist/injector.js"), "package.json"), JSON.stringify({ main: "injector.js" }));
					});
				},
			},
		],
	},
	{
		entryPoints: ["native/src/preload.ts"],
		outfile: "dist/preload.js",
		bundle: true,
		platform: "node",
		format: "cjs",
		sourcemap: true,
		minify: true,
		external: ["electron"],
	},
];

const buildAll = async () => {
	for (const opts of buildConfigs) await esbuildBuild(opts);
};

const watchAll = async () => {
	for (const opts of buildConfigs) (await context(opts)).watch();
};

if (process.argv.includes("--watch")) watchAll();
else buildAll();
