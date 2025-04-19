import React from "react";

import Link, { type LinkProps } from "@mui/material/Link";

export interface LunaLinkProps extends LinkProps {}
export const LunaLink = (props: LunaLinkProps) => {
	const href = props.href ?? (typeof props.children === "string" ? props.children : undefined);
	return (
		<Link
			{...props}
			sx={{
				textDecoration: "none !important",
			}}
			href={href}
			target={"_blank"}
		/>
	);
};
