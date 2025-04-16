import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

import { writeFileSync } from "fs";
import { dirname, join } from "path";

const writePackageJson = () => ({
	writeBundle: (options) => {
		writeFileSync(
			join(dirname(options.file), "package.json"),
			JSON.stringify({
				main: options.file.split("/").pop(),
			}),
		);
	},
});

export default [
	{
		input: "src/render/index.ts",
		output: {
			file: "dist/luna.js",
			format: "iife",
			sourcemap: true,
		},
		plugins: [typescript(), resolve({ browser: true }), terser()],
	},
	{
		input: "src/native/injector.ts",
		output: {
			file: "dist/injector.js",
			format: "cjs",
			sourcemap: true,
		},
		external: ["electron"],
		plugins: [typescript(), resolve(), terser(), writePackageJson()],
	},
	{
		input: "src/native/preload.ts",
		output: {
			file: "dist/preload.js",
			format: "cjs",
			sourcemap: true,
		},
		external: ["electron"],
		plugins: [typescript(), resolve(), terser()],
	},
];
