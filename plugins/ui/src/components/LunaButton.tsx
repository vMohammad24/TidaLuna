import React from "react";

import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";

export type LunaButtonProps = ButtonProps & {
	tooltip?: string;
};

export const LunaButton = (props: LunaButtonProps) => {
	return (
		<Tooltip sx={{ marginRight: "auto" }} title={props.tooltip ?? props.title}>
			<Button
				loadingIndicator={<CircularProgress color="warning" size={16} />}
				variant={props.variant ?? "contained"}
				children={props.children}
				{...props}
			/>
		</Tooltip>
	);
};
