import { redux } from "@luna/lib";
import React from "react";
import { LunaSwitchSetting, LunaTitle, settingsSx } from "../../components";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

type FeatureFlag<K extends string = string> = {
	created: number;
	name: K;
	type: "BOOLEAN";
	value: boolean;
};
type FeatureFlags = {
	flags: { [K in string]: FeatureFlag<K> };
};

const getFeatureFlags = (): FeatureFlags => redux.store.getState().featureFlags;

export const LunaFeatureFlags = React.memo(() => {
	const [featureFlags, setFeatureFlags] = React.useState(getFeatureFlags());
	const setFlag = React.useCallback((flag: FeatureFlag) => {
		redux.actions["featureFlags/SET_FLAGS"]({ [flag.name]: { ...flag, value: !flag.value } });
		setFeatureFlags(getFeatureFlags());
	}, []);
	return (
		<Box>
			<LunaTitle sx={{ marginBottom: 0 }} title="Feature flags" desc="Tidal desktop app feature flags" />
			<Grid spacing={2} container sx={settingsSx}>
				{Object.values(featureFlags.flags)
					.sort((a, b) => a.name.localeCompare(b.name))
					.map((flag) => (
						<Grid
							key={flag.name}
							size={6}
							sx={{ borderRadius: 4, backgroundColor: "rgba(0, 0, 0, 0.20)", boxShadow: 2, paddingLeft: 1.5 }}
							children={
								<LunaSwitchSetting
									disabled={flag.type !== "BOOLEAN"}
									title={flag.name[0].toUpperCase() + flag.name.slice(1).replaceAll("-", " ")}
									onClick={setFlag.bind(null, flag)}
									checked={flag.value}
								/>
							}
						/>
					))}
			</Grid>
		</Box>
	);
});
