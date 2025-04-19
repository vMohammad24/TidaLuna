import React from "react";

import Container from "@mui/material/Container";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import { PluginSettings } from "./PluginSettings";

import ExtensionIcon from "@mui/icons-material/Extension";
import SettingsIcon from "@mui/icons-material/Settings";

enum SettingsTab {
	Plugins = "Plugins",
	Settings = "Settings",
}

export const LunaSettings = () => {
	const [tab, setTab] = React.useState(SettingsTab.Plugins);
	return (
		<Container maxWidth="md" sx={{ padding: 0, marginBottom: 10, flexGrow: 1 }}>
			<Tabs value={tab} onChange={(_, tab) => setTab(tab)}>
				<Tab iconPosition="start" icon={<ExtensionIcon />} value={SettingsTab.Plugins} label={SettingsTab.Plugins} />
				<Tab iconPosition="start" icon={<SettingsIcon />} value={SettingsTab.Settings} label={SettingsTab.Settings} />
			</Tabs>
			<Container sx={{ marginTop: 3, marginLeft: -3 }}>{tab === SettingsTab.Plugins && <PluginSettings />}</Container>
		</Container>
	);
};
