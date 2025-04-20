import { type BuildOptions } from "esbuild";

import { readdir } from "fs/promises";
import { join } from "path";

import { listen, pluginBuildOptions } from ".";

const pluginFolders = await readdir(join(process.cwd(), "./plugins"));
const buildConfigs: BuildOptions[] = await Promise.all(pluginFolders.map((name) => pluginBuildOptions(`./plugins/${name}`)));

listen(buildConfigs);
