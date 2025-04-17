import type { AnyRecord } from "@inrixia/helpers";
import type { Plugin } from "esbuild";
import { mkdir, writeFile } from "fs/promises";
import { basename, dirname, join } from "path";

export const writeBundlePlugin = (pluginPackage?: AnyRecord): Plugin => ({
	name: "writeBundlePlugin",
	setup(build) {
		build.onEnd(async (result) => {
			if (result.errors.length > 0) throw new Error(JSON.stringify(result.errors));

			let writePackageJson = false;
			for (const outputFile of result.outputFiles ?? []) {
				const outDir = dirname(outputFile.path);
				await mkdir(outDir, { recursive: true });

				if (pluginPackage?.name) {
					// Swap outputFile.path filename with pluginPackage.name retaining extension
					const fileExt = outputFile.path.slice(outputFile.path.lastIndexOf("."));
					// Sanitize pluginPackage.name, remove @, replace / with .
					const safeName = pluginPackage.name.replace(/@/g, "").replace(/\//g, ".");
					outputFile.path = join(outDir, `${safeName}${fileExt}`);
				}

				await writeFile(outputFile.path, outputFile.contents);

				if (!writePackageJson) {
					await writeFile(
						outputFile.path.replace(/\.js$/, ".json"),
						JSON.stringify({
							...pluginPackage,
							hash: outputFile.hash,
						}),
					);
					// Only write the package.json once
					writePackageJson = true;
				}

				const fileSizeInBytes = outputFile.contents.byteLength;
				const kB = 1024;
				const showInkB = fileSizeInBytes < kB * kB; // 1 MB in bytes
				const fileSizeDisp = showInkB ? `${(fileSizeInBytes / kB).toFixed(2)}kB` : `${(fileSizeInBytes / (kB * kB)).toFixed(2)}mB`;

				console.log(`Built [${outputFile.hash}] ${fileSizeDisp} ${basename(outputFile.path)}!`);
			}
		});
	},
});
