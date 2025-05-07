import Box, { type BoxProps } from "@mui/material/Box";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import React, { type ReactNode } from "react";

export type LunaTitleValues = {
	title: ReactNode;
	desc?: ReactNode;
	variant?: TypographyProps["variant"];
};
export type LunaTitleProps = BoxProps & TypographyProps & LunaTitleValues;
export const LunaTitle = React.memo((props: LunaTitleProps) => {
	props.variant ??= "h6";
	return (
		<Box>
			<Typography {...props}>
				<Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					{props.title}
					{props.children}
				</Box>
			</Typography>
			{props.desc && <Typography variant="subtitle2" gutterBottom children={props.desc} />}
		</Box>
	);
});
