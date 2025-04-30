import { type BuildOptions } from "esbuild";

import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

import { listen, pluginBuildOptions } from ".";

const pluginFolders = await readdir(join(process.cwd(), "./plugins"));
const buildConfigs: BuildOptions[] = await Promise.all(pluginFolders.map((name) => pluginBuildOptions(`./plugins/${name}`)));

listen(buildConfigs);

// Quick export of plugins for store functionality
if (process.argv.includes("--watch")) {
	const pkg = JSON.parse(await readFile(join(process.cwd(), "./package.json"), "utf8"));
	pkg.plugins ??= pluginFolders;
	await mkdir(join(process.cwd(), "./dist"), { recursive: true });
	await writeFile(join(process.cwd(), "./dist/store.json"), JSON.stringify(pkg));
}
