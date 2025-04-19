import Box, { type BoxProps } from "@mui/material/Box";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import React, { type ReactNode } from "react";

export type LunaTitleValues = TypographyProps & {
	title: ReactNode;
	desc?: ReactNode;
};
export type LunaTitleProps = BoxProps & TypographyProps & LunaTitleValues;
export const LunaTitle = (props: LunaTitleProps) => {
	props.variant ??= "h6";
	return (
		<Box>
			<Typography {...props}>{props.title}</Typography>
			{props.desc && <Typography variant="subtitle2" gutterBottom children={props.desc} />}
		</Box>
	);
};
