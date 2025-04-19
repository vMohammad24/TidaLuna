import React from "react";

import Stack from "@mui/material/Stack";
import { LunaSecureText } from "./components";
import { LunaNumber } from "./components/LunaNumber";
import { LunaStack } from "./components/LunaStack";

export const PluginSettings = () => {
	return (
		<Stack spacing={2}>
			<LunaStack variant="h5" title="Main" desc="Core functionality of Luna">
				<LunaNumber />
				<LunaSecureText value={"Hi"} />
				{/* <LunaModuleSettings module={coverTheme} />
		<LunaModuleSettings module={realMax} /> */}
			</LunaStack>

			<LunaStack variant="h5" title="Scrobbling" desc="Scrobblers for saving & sharing listen history & currently listening">
				{/* <LunaModuleSettings module={discordRPC} />
		<LunaModuleSettings module={lastFM} />
		<LunaModuleSettings module={listenBrainz} /> */}
			</LunaStack>

			<LunaStack variant="h5" title="Tweaks" desc="A collection of tweaks and improvements to the tidal client">
				{/* <LunaModuleSettings module={noBuffer} />
		<LunaModuleSettings module={volumeScroll} />
		<LunaModuleSettings module={nativeFullscreen} />
		<LunaModuleSettings module={smallWindow} />
		<LunaModuleSettings module={persistSettings} />
		<LunaModuleSettings module={themer} />
		<LunaModuleSettings module={shazam} /> */}
			</LunaStack>

			<LunaStack variant="h5" title="_DEV.Tools" desc="Various developer tools for working with Neptune">
				{/* <LunaModuleSettings module={devTools} /> */}
			</LunaStack>
		</Stack>
	);
};
