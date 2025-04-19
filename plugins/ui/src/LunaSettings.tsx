import Stack from "@mui/material/Stack";
import React from "react";

import { LunaPluginSettings, LunaTitle } from "./components";

import { LunaPlugin } from "@luna/core";

export const LunaSettings = React.memo(() => {
	return (
		<Stack spacing={2}>
			<Stack spacing={1}>
				<LunaTitle title="Luna plugins" desc="Plugins providing main luna functionality" />
				<LunaPluginSettings plugin={LunaPlugin.plugins["@luna/lib"]} />
				<LunaPluginSettings plugin={LunaPlugin.plugins["@luna/ui"]} />
			</Stack>
		</Stack>
	);
});
