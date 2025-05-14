import Box from "@mui/material/Box";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import React from "react";

export type LunaTitleValues = {
	title: React.ReactNode;
	desc?: React.ReactNode;
	variant?: TypographyProps["variant"];
};
export type LunaTitleProps = LunaTitleValues & TypographyProps;
export const LunaTitle = React.memo((props: LunaTitleProps) => {
	props.variant ??= "h6";
	const title = props.title;
	if (typeof title !== "string") delete props.title;
	return (
		<Box>
			<Typography {...props}>
				<Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					{title}
					{props.children}
				</Box>
			</Typography>
			{props.desc && <Typography variant="subtitle2" gutterBottom children={props.desc} />}
		</Box>
	);
});
