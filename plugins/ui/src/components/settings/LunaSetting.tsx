import React from "react";

import Stack, { type StackProps } from "@mui/material/Stack";
import { LunaTitle, type LunaTitleValues } from "../LunaTitle";

export type LunaSettingProps = StackProps & LunaTitleValues;
export const LunaSetting = (props: LunaSettingProps) => (
	<Stack direction="row" {...props} title={undefined} sx={{ flexGrow: 1 }}>
		<LunaTitle variant="h8" title={props.title} desc={props.desc} />
		{props.children}
	</Stack>
);
