import React, { useCallback, useEffect, useState } from "react";

import { store as obyStore } from "oby";

import Stack from "@mui/material/Stack";
import { InstallFromUrl } from "./lunaPageComponents/InstallFromUrl";

import { ReactiveStore } from "@luna/core";
import { LunaStore } from "./lunaPageComponents/LunaStore";

const pluginStores = ReactiveStore.getStore("@luna/pluginStores");
export const storeUrls = await pluginStores.getReactive<string[]>("storeUrls", []);

export const PluginStoreTab = React.memo(() => {
	const [_storeUrls, setPluginStores] = useState<string[]>(obyStore.unwrap(storeUrls));

	useEffect(() => obyStore.on(storeUrls, () => setPluginStores([...obyStore.unwrap(storeUrls)])), []);
	const onRemove = useCallback((storeUrl: string) => {
		const index = storeUrls.indexOf(storeUrl);
		if (index > -1) storeUrls.splice(index, 1);
	}, []);

	return (
		<Stack spacing={2}>
			<InstallFromUrl />
			<LunaStore url={"http://127.0.0.1:3000"} onRemove={() => {}} />
			{_storeUrls.map((store) => (
				<LunaStore key={store} url={store} onRemove={() => onRemove(store)} />
			))}
		</Stack>
	);
});
