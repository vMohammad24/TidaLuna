import React from "react";

import Stack from "@mui/material/Stack";

import { LunaPlugin } from "@luna/core";
import { LunaPluginSettings } from "./lunaPageComponents/LunaPluginSettings";

export const PluginsTab = React.memo(() => {
	const plugins = [];
	for (const pluginName in LunaPlugin.plugins) {
		if (LunaPlugin.lunaPlugins.includes(pluginName)) continue;
		plugins.push(<LunaPluginSettings key={pluginName} plugin={LunaPlugin.plugins[pluginName]} />);
	}
	if (plugins.length === 0) return "You have no plugins installed!";
	return <Stack spacing={2}>{plugins}</Stack>;
});
