import React from "react";

import { LunaPlugin, type PluginPackage } from "@luna/core";

import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { LunaTrashButton, SpinningButton } from "../../components";
import { LunaPluginHeader } from "../PluginsTab/LunaPluginHeader";
import { LunaStorePlugin } from "./LunaStorePlugin";

interface StorePackage extends PluginPackage {
	plugins: string[];
}

interface StorePluginData {
	package?: PluginPackage;
	error?: string;
	id: string;
	url: string;
}

export const LunaStore = React.memo(({ url, onRemove, filter }: { url: string; onRemove: () => void; filter?: string }) => {
	const [loading, setLoading] = React.useState(false);
	const [loadError, setLoadError] = React.useState<string | undefined>(undefined);
	const [pkg, setPackage] = React.useState<StorePackage | undefined>(undefined);

	const disabled = loading; // Disable controls while loading

	const fetchPackage = React.useCallback(async () => {
		setLoading(true);
		setLoadError(undefined);
		try {
			const response = await fetch(`${url}/store.json`);
			if (!response.ok) throw new Error(`Failed to fetch package: ${response.statusText}`);
			const data = await response.json();
			setPackage(data);
		} catch (error: any) {
			console.error("Error fetching package:", error);
			setLoadError(error.message || "Unknown error occurred");
			setPackage(undefined); // Clear package on error
		} finally {
			setLoading(false);
		}
	}, [url]);

	React.useEffect(() => {
		fetchPackage();
	}, [fetchPackage]); // Depend on the memoized fetch function

	const isLocalDevStore = url === "http://127.0.0.1:3000";

	const [plugins, setPlugins] = React.useState<StorePluginData[]>([]);
	const [pluginsLoaded, setPluginsLoaded] = React.useState(false);

	React.useEffect(() => {
		if (!pkg) {
			setPlugins([]);
			setPluginsLoaded(false);
			return;
		}

		let aborted = false;
		setPluginsLoaded(false);
		const promises = pkg.plugins.map(async (pluginPath): Promise<StorePluginData> => {
			const pluginUrl = `${url}/${isLocalDevStore ? pluginPath : pluginPath.replace(" ", ".")}`;
			try {
				const packageData = await LunaPlugin.fetchPackage(pluginUrl);
				return { package: packageData, url: pluginUrl, id: pluginPath };
			} catch (e: any) {
				return { error: e.message || "Unknown error", url: pluginUrl, id: pluginPath };
			}
		});

		Promise.all(promises).then((results) => {
			if (aborted) return;
			setPlugins(results);
			setPluginsLoaded(true);
		});

		return () => {
			aborted = true;
		};
	}, [pkg, url, isLocalDevStore]);

	const filteredPlugins = React.useMemo(() => {
		if (!filter) return plugins;
		const lowerFilter = filter.toLowerCase();
		return plugins.filter((p) => {
			if (p.error) return false;
			if (!p.package) return false;
			const authorName = typeof p.package.author === "string" ? p.package.author : p.package.author?.name;
			return (
				p.package.name.toLowerCase().includes(lowerFilter) ||
				String(p.package.description ?? "")
					.toLowerCase()
					.includes(lowerFilter) ||
				authorName?.toLowerCase().includes(lowerFilter)
			);
		});
	}, [plugins, filter]);

	if (pkg === undefined && !loading && !loadError) return null; // Don't render anything until initial load attempt
	if (!isLocalDevStore && loading && !pkg) return <Typography>Loading store {url}...</Typography>; // Show loading indicator if still loading initially

	let name = pkg?.name ?? "Unknown Store";
	if (isLocalDevStore) name = `${name} [DEV]`;

	const author = pkg?.author;
	const desc = pkg?.description;

	const link = pkg?.homepage ?? pkg?.repository?.url ?? url;
	// Don't show error for local dev store
	if (loadError && isLocalDevStore) return null;

	if (filter && filteredPlugins.length === 0 && pluginsLoaded) return null;

	return (
		<Stack
			spacing={1}
			sx={{
				borderRadius: 3,
				backgroundColor: "rgba(0, 0, 0, 0.10)",
				boxShadow: loadError ? "0 0 10px rgba(255, 0, 0, 0.70)" : "none",
				padding: 2,
			}}
		>
			<LunaPluginHeader
				name={name}
				link={link}
				loadError={loadError}
				author={author}
				desc={desc}
				children={
					<>
						<SpinningButton title="Reload store" spin={loading} disabled={disabled} onClick={fetchPackage} />
						<LunaTrashButton disabled={isLocalDevStore} title="Remove store" onClick={onRemove} />
					</>
				}
			/>
			<Grid columns={2} spacing={2} container>
				{filteredPlugins.map((p) => (
					<Grid size={1} key={p.id}>
						<LunaStorePlugin url={p.url} package={p.package} loadError={p.error} />
					</Grid>
				))}
			</Grid>
		</Stack>
	);
});
