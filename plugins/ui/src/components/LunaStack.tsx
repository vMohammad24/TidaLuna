import React from "react";

import Box from "@mui/material/Box";
import type { StackProps } from "@mui/material/Stack";
import Stack from "@mui/material/Stack";
import { LunaTitle, type LunaTitleValues } from "./LunaTitle";

export type LunaStackProps = StackProps & Partial<LunaTitleValues>;

export const LunaStack = (props: LunaStackProps) => {
	const { title, desc, variant } = props;
	delete props.title;
	return (
		<Box>
			{title && <LunaTitle variant={variant} title={title} desc={desc} />}
			<Stack spacing={1} {...props} />
		</Box>
	);
};
