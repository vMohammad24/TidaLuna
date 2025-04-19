import React from "react";

import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { LunaAuthor } from "@luna/core";

const AuthorName = ({ name }: { name: string }) => (
	<Typography sx={{ fontWeight: 500, paddingTop: 0.2 }}>
		<Typography variant="caption" style={{ opacity: 0.7 }} children="by " />
		{name}
	</Typography>
);

export const LunaPluginAuthor = ({ author }: { author: LunaAuthor | string }) => {
	if (typeof author === "string") return <AuthorName name={author} />;
	return (
		<Tooltip title={`Visit ${author.name}'s profile`}>
			<Stack
				direction="row"
				spacing={1}
				alignItems="center"
				onClick={() => {
					window.open(author.url, "_blank");
				}}
				sx={{ cursor: "pointer" }}
			>
				<AuthorName name={author.name} />
				{author.avatarUrl && (
					<Avatar
						src={author.avatarUrl}
						sx={{
							width: 28,
							height: 28,
						}}
					/>
				)}
			</Stack>
		</Tooltip>
	);
};
