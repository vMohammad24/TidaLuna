import React, { type PropsWithChildren } from "react";

import Container from "@mui/material/Container";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import ExtensionIcon from "@mui/icons-material/Extension";
import PaletteIcon from "@mui/icons-material/Palette";
import SettingsIcon from "@mui/icons-material/Settings";
import StorefrontIcon from "@mui/icons-material/Storefront";

import { PluginsTab } from "./PluginsTab";
import { PluginStoreTab } from "./PluginStoreTab";
import { SettingsTab } from "./SettingsTab";

enum LunaTabs {
	Plugins = "Plugins",
	PluginStore = "Plugin Store",
	Settings = "Settings",
	Themes = "Themes",
}

const LunaTabPage = React.memo(({ tab, currentTab, children }: { tab: LunaTabs; currentTab: LunaTabs } & PropsWithChildren) => {
	if (tab !== currentTab) return;
	return <Container sx={{ marginTop: 3, marginLeft: -3 }} children={children} />;
});

export const LunaPage = React.memo(() => {
	const [currentTab, setCurrentTab] = React.useState(LunaTabs.Plugins);
	return (
		<Container maxWidth="md" sx={{ padding: 0, marginBottom: 10, flexGrow: 1 }}>
			<Tabs value={currentTab} onChange={(_, tab) => setCurrentTab(tab)}>
				<Tab iconPosition="start" icon={<ExtensionIcon />} value={LunaTabs.Plugins} label={LunaTabs.Plugins} />
				<Tab iconPosition="start" icon={<StorefrontIcon />} value={LunaTabs.PluginStore} label={LunaTabs.PluginStore} />
				<Tab iconPosition="start" icon={<PaletteIcon />} value={LunaTabs.Themes} label={LunaTabs.Themes} />
				<Tab iconPosition="start" icon={<SettingsIcon />} value={LunaTabs.Settings} label={LunaTabs.Settings} />
			</Tabs>
			<LunaTabPage tab={LunaTabs.Plugins} currentTab={currentTab} children={<PluginsTab />} />
			<LunaTabPage tab={LunaTabs.Settings} currentTab={currentTab} children={<SettingsTab />} />
			<LunaTabPage tab={LunaTabs.PluginStore} currentTab={currentTab} children={<PluginStoreTab />} />
		</Container>
	);
});
