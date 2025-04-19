import { TextField, type TextFieldProps } from "@mui/material";
import { grey } from "@mui/material/colors";
import React from "react";

export type LunaTextProps = TextFieldProps;

export const LunaText = (props: LunaTextProps) => (
	<TextField
		variant="outlined"
		{...props}
		sx={{
			"&.Mui-error": {
				"& .MuiOutlinedInput-notchedOutline": {
					borderColor: "warning.main",
				},
			},
			"& > :not(style)": { color: grey.A400 },
			"& .MuiOutlinedInput-input": {
				color: "white",
			},
			...props.sx,
		}}
	/>
);
