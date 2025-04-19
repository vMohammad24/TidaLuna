import React from "react";

import { LunaPlugin, unloadSet, type PluginPackage } from "@luna/core";
import { store as obyStore } from "oby";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { LunaAuthorDisplay, LunaSwitch, ReloadButton } from "../components";
import { LiveReloadToggle } from "./LiveReloadToggle";

export const LunaPluginSettings = React.memo(({ plugin }: { plugin: LunaPlugin }) => {
	// Have to wrap in function call as Settings is a functional component
	const [Settings, setSettings] = React.useState(() => plugin.exports.Settings);

	const [enabled, setEnabled] = React.useState(plugin.enabled);
	const [loading, setLoading] = React.useState(true);
	const [loadError, setLoadError] = React.useState(plugin.loadError._);

	const [pkg, setPackage] = React.useState<PluginPackage>(obyStore.unwrap(plugin.store.package));

	React.useEffect(() => {
		const unloads = new Set([
			plugin.onSetEnabled((next) => setEnabled(next)),
			plugin.loading.onValue((next) => {
				// If stopped loading then update settings
				if (next === false) setSettings(() => plugin.exports.Settings);
				setLoading(next);
			}),
			plugin.loadError.onValue((next) => setLoadError(next)),
			obyStore.on(
				() => plugin.store.package,
				() => setPackage(obyStore.unwrap(plugin.store.package)),
			),
		]);
		return () => {
			unloadSet(unloads);
		};
	}, [plugin]);

	const disabled = !enabled || loading;

	const author = pkg.author;
	const desc = pkg.description;
	const name = pkg.name;

	// Dont allow disabling core plugins
	const canDisable = !LunaPlugin.lunaPlugins.includes(name);

	// Memoize callbacks
	const handleReload = React.useCallback(() => plugin.reload(), [plugin]);

	return (
		<Stack
			spacing={1}
			sx={{
				borderRadius: 3,
				backgroundColor: "rgba(0, 0, 0, 0.10)",
				boxShadow: loadError ? "0 0 10px rgba(255, 0, 0, 0.70)" : "none",
				padding: 2,
				paddingTop: 1,
				paddingBottom: Settings ? 2 : 1,
			}}
		>
			<Box>
				<Stack direction="row" spacing={1}>
					<Box sx={{ minWidth: 85 }}>
						<Typography sx={{ marginTop: 0.5 }} variant="h6" children={name} />
					</Box>
					{canDisable && (
						<Tooltip title={enabled ? `Disable ${name}` : `Enable ${name}`} children={<LunaSwitch checked={enabled} loading={loading} />} />
					)}
					<Tooltip title="Reload module">
						<ReloadButton spin={loading} disabled={disabled} onClick={handleReload} />
					</Tooltip>
					<LiveReloadToggle plugin={plugin} disabled={disabled} sx={{ marginLeft: 1 }} />
					{loadError && (
						<Typography
							variant="caption"
							sx={{
								color: "white",
								fontWeight: 500,
								backgroundColor: "rgba(256, 0, 0, 0.5)",
								padding: 1,
								borderRadius: 1,
								paddingTop: 1.5,
							}}
							children={loadError}
						/>
					)}
					<Box sx={{ flexGrow: 1 }} /> {/* This pushes the author section to the right */}
					{author && <LunaAuthorDisplay author={author} />}
				</Stack>
				{desc && <Typography variant="subtitle2" gutterBottom children={desc} />}
			</Box>

			{Settings && <Settings />}
		</Stack>
	);
});
