import Box from "@mui/material/Box";
import React from "react";

import { LunaSecureText, type LunaSecureTextProps } from "./LunaSecureText";
import { LunaSetting } from "./LunaSetting";
import { type LunaTitleValues } from "./LunaTitle";

export type LunaSecureTextSettingProps = LunaSecureTextProps & LunaTitleValues;
export const LunaSecureTextSetting = (props: LunaSecureTextSettingProps) => (
	<LunaSetting spacing={8} title={props.title} desc={props.desc}>
		<Box flexGrow={1}>
			<LunaSecureText fullWidth size="small" sx={{ marginTop: 0.75 }} {...props} placeholder={props.title} label={null} />
		</Box>
	</LunaSetting>
);
