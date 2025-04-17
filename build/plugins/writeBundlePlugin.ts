import type { AnyRecord } from "@inrixia/helpers";
import type { Plugin } from "esbuild";

import { mkdir, writeFile } from "fs/promises";
import { basename, dirname } from "path";

export const writeBundlePlugin = (pluginPackage?: AnyRecord): Plugin => ({
	name: "writeBundlePlugin",
	setup(build) {
		build.onEnd(async (result) => {
			if (result.errors.length > 0) throw new Error(JSON.stringify(result.errors));

			let writePackageJson = false;
			for (const outputFile of result.outputFiles ?? []) {
				const outDir = dirname(outputFile.path);
				await mkdir(outDir, { recursive: true });

				// Not a plugin, carry on
				if (!pluginPackage?.name) await writeFile(outputFile.path, outputFile.contents);
				else {
					const code = Buffer.from(outputFile.contents).toString("utf8").replaceAll("@luna/lib", `lu://luna/luna.lib.js?${outputFile.hash}`);

					await writeFile(outputFile.path, code);

					if (!writePackageJson && outputFile.path.endsWith(".js")) {
						await writeFile(
							outputFile.path.replace(/\.js$/, ".json"),
							JSON.stringify({
								...pluginPackage,
								// This is no longer accurate after mapping imports
								hash: outputFile.hash,
							}),
						);
						// Only write the package.json once
						writePackageJson = true;
					}
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
