import React from "react";
import { LunaStack, type LunaStackProps } from "../LunaStack";

export const LunaSettings = (props: LunaStackProps) => (
	<LunaStack
		{...props}
		variant="h7"
		sx={{
			borderRadius: 2,
			backgroundColor: "rgba(0, 0, 0, 0.20)",
			boxShadow: 5,
			padding: 2,
			paddingBottom: 1,
		}}
	/>
);
