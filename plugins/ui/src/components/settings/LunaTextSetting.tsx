import React from "react";

import TextField, { type TextFieldProps } from "@mui/material/TextField";

import { type LunaTitleValues } from "../LunaTitle";
import { LunaSetting } from "./LunaSetting";

export type LunaTextSettingProps = TextFieldProps & LunaTitleValues;
export const LunaTextSetting = (props: LunaTextSettingProps) => (
	<LunaSetting spacing={8} title={props.title} desc={props.desc}>
		<TextField
			variant="outlined"
			size="small"
			fullWidth
			sx={{ height: "80%", marginTop: 0.25 }}
			{...props}
			placeholder={props.title}
			label={null}
		/>
	</LunaSetting>
);
