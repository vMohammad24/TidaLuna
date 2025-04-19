import React, { type PropsWithChildren } from "react";

import Container from "@mui/material/Container";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import ExtensionIcon from "@mui/icons-material/Extension";
import PaletteIcon from "@mui/icons-material/Palette";
import SettingsIcon from "@mui/icons-material/Settings";
import StorefrontIcon from "@mui/icons-material/Storefront";

import { LunaSettings } from "./LunaSettings";
import { PluginSettings } from "./PluginSettings";
import { PluginStore } from "./PluginStore";

enum SettingsTab {
	Plugins = "Plugins",
	PluginStore = "Plugin Store",
	Settings = "Settings",
	Themes = "Themes",
}

const LunaTabPage = React.memo(({ tab, currentTab, children }: { tab: SettingsTab; currentTab: SettingsTab } & PropsWithChildren) => {
	if (tab !== currentTab) return;
	return <Container sx={{ marginTop: 3, marginLeft: -3 }} children={children} />;
});

export const LunaPage = React.memo(() => {
	const [currentTab, setCurrentTab] = React.useState(SettingsTab.Plugins);
	return (
		<Container maxWidth="md" sx={{ padding: 0, marginBottom: 10, flexGrow: 1 }}>
			<Tabs value={currentTab} onChange={(_, tab) => setCurrentTab(tab)}>
				<Tab iconPosition="start" icon={<ExtensionIcon />} value={SettingsTab.Plugins} label={SettingsTab.Plugins} />
				<Tab iconPosition="start" icon={<StorefrontIcon />} value={SettingsTab.PluginStore} label={SettingsTab.PluginStore} />
				<Tab iconPosition="start" icon={<PaletteIcon />} value={SettingsTab.Themes} label={SettingsTab.Themes} />
				<Tab iconPosition="start" icon={<SettingsIcon />} value={SettingsTab.Settings} label={SettingsTab.Settings} />
			</Tabs>
			<LunaTabPage tab={SettingsTab.Plugins} currentTab={currentTab} children={<PluginSettings />} />
			<LunaTabPage tab={SettingsTab.Settings} currentTab={currentTab} children={<LunaSettings />} />
			<LunaTabPage tab={SettingsTab.PluginStore} currentTab={currentTab} children={<PluginStore />} />
		</Container>
	);
});
