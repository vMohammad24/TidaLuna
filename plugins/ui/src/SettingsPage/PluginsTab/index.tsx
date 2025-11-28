import React, { useState } from "react";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

import { LunaPlugin } from "@luna/core";
import { LunaPluginSettings } from "./LunaPluginSettings";

export const PluginsTab = React.memo(() => {
	const [search, setSearch] = useState("");
	const [reloading, setReloading] = useState(false);

	const handleReloadAll = React.useCallback(async () => {
		setReloading(true);
		try {
			const reloadPromises = [];
			for (const pluginName in LunaPlugin.plugins) {
				if (LunaPlugin.corePlugins.has(pluginName)) continue;
				const plugin = LunaPlugin.plugins[pluginName];
				if (plugin.enabled) {
					reloadPromises.push(plugin.reload());
				}
			}
			await Promise.all(reloadPromises);
		} finally {
			setReloading(false);
		}
	}, []);

	const plugins = React.useMemo(() => {
		const result = [];
		for (const pluginName in LunaPlugin.plugins) {
			if (LunaPlugin.corePlugins.has(pluginName)) continue;
			const plugin = LunaPlugin.plugins[pluginName];
			if (search) {
				const lowerSearch = search.toLowerCase();
				const authorName = typeof plugin.package?.author === "string" ? plugin.package.author : plugin.package?.author?.name;
				if (
					!plugin.name.toLowerCase().includes(lowerSearch) &&
					!String(plugin.package?.description ?? "")
						.toLowerCase()
						.includes(lowerSearch) &&
					!authorName?.toLowerCase().includes(lowerSearch)
				)
					continue;
			}
			result.push(<LunaPluginSettings key={pluginName} plugin={plugin} />);
		}
		return result;
	}, [search]);

	const hasPlugins = Object.keys(LunaPlugin.plugins).filter((p) => !LunaPlugin.corePlugins.has(p)).length > 0;

	if (!hasPlugins) return "You have no plugins installed!";

	return (
		<Stack spacing={2}>
			<Box sx={{ display: "flex", gap: 2 }}>
				<TextField label="Search plugins" variant="outlined" fullWidth value={search} onChange={(e) => setSearch(e.target.value)} />
				<Button variant="contained" onClick={handleReloadAll} disabled={reloading}>
					{reloading ? "Reloading..." : "Reload All"}
				</Button>
			</Box>
			{plugins.length > 0 ? plugins : "No plugins found matching your search."}
		</Stack>
	);
});
