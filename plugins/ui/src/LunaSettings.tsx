import React from "react";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import Stack from "@mui/material/Stack";

import { LunaStack } from "./components/LunaStack";

export const LunaSettings = () => {
	return (
		<Container maxWidth="md" sx={{ paddingBottom: 10 }}>
			<Box marginBottom={4}>
				<Typography variant="h2" sx={{ fontVariant: "small-caps" }}>
					Luna Settings
				</Typography>
				<Typography marginLeft={1} variant="subtitle1">
					Luna is the largest moon of Neptune, notable for its retrograde orbit and icy, cryovolcanically active surface.
				</Typography>
			</Box>
			<Stack spacing={2}>
				<LunaStack variant="h5" title="Main" desc="Core functionality of Luna">
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
		</Container>
	);
};
