import React from "react";

import { LunaPlugin, unloadSet, type PluginPackage } from "@luna/core";
import { store as obyStore } from "oby";

import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";

import { LunaSwitch, LunaTrashButton } from "../components";
import { LiveReloadToggle } from "./LiveReloadToggle";
import { LunaPluginHeader } from "./LunaPluginHeader";
import { SpinningButton } from "./SpinningButton";

import SettingsIcon from "@mui/icons-material/Settings";
import { grey } from "@mui/material/colors";

export const LunaPluginSettings = React.memo(({ plugin }: { plugin: LunaPlugin }) => {
	// Have to wrap in function call as Settings is a functional component
	const [enabled, setEnabled] = React.useState(plugin.enabled);
	const [loading, setLoading] = React.useState(plugin.loading._);
	const [loadError, setLoadError] = React.useState(plugin.loadError._);
	const [installed, setInstalled] = React.useState(plugin.installed);
	const [hideSettings, setHideSettings] = React.useState(plugin.store.hideSettings);

	const [pkg, setPackage] = React.useState<PluginPackage>(obyStore.unwrap(plugin.store.package));

	React.useEffect(() => {
		const unloads = new Set([
			plugin.onSetEnabled((next) => setEnabled(next)),
			plugin.loading.onValue((next) => setLoading(next)),
			plugin.loadError.onValue((next) => setLoadError(next)),
			obyStore.on(
				() => plugin.store.package,
				() => setPackage(obyStore.unwrap(plugin.store.package)),
			),
			obyStore.on(
				() => plugin.installed,
				() => setInstalled(obyStore.unwrap(plugin.store.installed)),
			),
		]);
		return () => {
			unloadSet(unloads);
		};
	}, [plugin]);

	// Memoize callbacks
	const handleReload = React.useCallback(plugin.reload.bind(plugin), [plugin]);
	const toggleEnabled = React.useCallback((_: unknown, checked: boolean) => (checked ? plugin.enable() : plugin.disable()), [plugin]);
	const uninstall = React.useCallback(plugin.uninstall.bind(plugin), [plugin]);

	if (!installed) return null;

	const disabled = !enabled || loading;

	const author = pkg.author;
	const desc = pkg.description;
	const name = pkg.name;
	const link = pkg.homepage ?? pkg.repository?.url;

	// Dont allow disabling core plugins
	const isCore = LunaPlugin.corePlugins.has(name);

	const Settings = plugin.exports?.Settings;
	const hasSettings = Settings !== undefined && Settings !== null;

	return (
		<Stack
			spacing={1}
			sx={{
				borderRadius: 3,
				backgroundColor: "rgba(0, 0, 0, 0.10)",
				boxShadow: loadError ? "0 0 10px rgba(255, 0, 0, 0.70)" : "none",
				padding: 2,
				paddingTop: 1,
				paddingBottom: hasSettings ? 2 : 1,
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
						{!isCore && (
							<Tooltip
								title={enabled ? `Disable ${name}` : `Enable ${name}`}
								children={<LunaSwitch checked={enabled} loading={loading} onChange={toggleEnabled} />}
							/>
						)}
						<SpinningButton title="Reload plugin" spin={loading} disabled={disabled} onClick={handleReload} />
						<LiveReloadToggle plugin={plugin} disabled={disabled} sx={{ marginLeft: 1 }} />
						<SpinningButton
							title={hideSettings ? "Show settings" : "Hide settings"}
							spin={loading}
							disabled={disabled || !hasSettings}
							onClick={() => setHideSettings((prev) => (plugin.store.hideSettings = !prev))}
							icon={SettingsIcon}
							sxColor={grey.A400}
						/>
						{/* Don't show uninstall button for core plugins */}
						{!isCore && <LunaTrashButton title="Uninstall plugin" onClick={uninstall} />}
					</>
				}
			/>
			{hasSettings && !hideSettings && <Settings />}
		</Stack>
	);
});
