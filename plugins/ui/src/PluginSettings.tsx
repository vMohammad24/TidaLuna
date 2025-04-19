import React from "react";

import { LunaPlugin } from "@luna/core";
import Stack from "@mui/material/Stack";
import { LunaPluginSettings, LunaStack } from "./components";

export const PluginSettings = () => {
	return (
		<Stack spacing={2}>
			<LunaStack variant="h5" title="Main" desc="Core functionality of Luna">
				<LunaPluginSettings plugin={LunaPlugin.plugins["@luna/lib"]} />
				<LunaPluginSettings plugin={LunaPlugin.plugins["@luna/ui"]} />
			</LunaStack>

			<LunaStack variant="h5" title="Scrobbling" desc="Scrobblers for saving & sharing listen history & currently listening"></LunaStack>
			<LunaStack variant="h5" title="Tweaks" desc="A collection of tweaks and improvements to the tidal client"></LunaStack>
			<LunaStack variant="h5" title="_DEV.Tools" desc="Various developer tools for working with Neptune"></LunaStack>
		</Stack>
	);
};
