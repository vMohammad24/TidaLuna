import type { Plugin } from "esbuild";

export const dynamicExternalsPlugin = (resolveModuleContents: (module: string) => string): Plugin => ({
	name: "dynamicExternals",
	setup(build) {
		const externalsRegex = build.initialOptions.external
			?.map((str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*"))
			.join("|");
		if (externalsRegex === undefined) return;
		build.onResolve({ filter: new RegExp(`^(?:${externalsRegex})$`) }, (args) => ({
			path: args.path,
			namespace: "dynamicExternals",
		}));
		build.onLoad({ filter: /.*/, namespace: "dynamicExternals" }, (args) => ({
			contents: resolveModuleContents(args.path),
		}));
	},
});
