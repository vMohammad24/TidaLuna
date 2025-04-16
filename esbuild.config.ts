import { context, type BuildOptions } from "esbuild";
import { writeFileSync } from "fs";
import { dirname, join } from "path";

const watch = async (opts: BuildOptions) => (await context(opts)).watch();

watch({
	entryPoints: ["render/src/index.ts"],
	outfile: "dist/luna.js",
	bundle: true,
	format: "iife",
	sourcemap: true,
	minify: true,
});

watch({
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
				build.onEnd((result) => {
					writeFileSync(join(dirname("dist/injector.js"), "package.json"), JSON.stringify({ main: "injector.js" }));
				});
			},
		},
	],
});

watch({
	entryPoints: ["native/src/preload.ts"],
	outfile: "dist/preload.js",
	bundle: true,
	platform: "node",
	format: "cjs",
	sourcemap: true,
	minify: true,
	external: ["electron"],
});
