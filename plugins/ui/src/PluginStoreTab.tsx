import React from "react";

import Stack from "@mui/material/Stack";
import { InstallFromUrl } from "./lunaPageComponents/InstallFromUrl";

export const PluginStoreTab = React.memo(() => {
	return (
		<Stack spacing={2}>
			<InstallFromUrl />
		</Stack>
	);
});
