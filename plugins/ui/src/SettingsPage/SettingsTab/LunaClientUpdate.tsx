import { ftch } from "@luna/core";
import React from "react";

import { components } from "@octokit/openapi-types";
type GitHubRelease = components["schemas"]["release"];

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

import { LunaButton, LunaSettings, SpinningButton } from "../../components";

export const LunaClientUpdate = React.memo(() => {
	const [releases, setReleases] = React.useState<GitHubRelease[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [selectedRelease, setSelectedRelease] = React.useState<string | null>(null);

	const fetchReleases = async () => {
		setLoading(true);
		const releases = await ftch.json<GitHubRelease[]>("https://api.github.com/repos/Inrixia/TidaLuna/releases").finally(() => setLoading(false));
		setReleases(releases);
		if (selectedRelease === null && releases.length > 0) setSelectedRelease(releases[0].tag_name);
	};

	React.useEffect(() => {
		fetchReleases();
	}, []);

	return (
		<Box>
			<LunaSettings
				title="Client Updates"
				desc="Select release tag & update client"
				titleChildren={<SpinningButton title="Fetch releases" loading={loading} onClick={fetchReleases} />}
				direction="row"
				alignItems="center"
			>
				<LunaButton children="Update Client" />
				<Select
					fullWidth
					sx={{ flex: 1 }}
					value={selectedRelease}
					onChange={(e) => setSelectedRelease(e.target.value)}
					children={releases.map((release) => {
						const tag = `${release.tag_name}${release.prerelease ? "-dev" : ""}`;
						return <MenuItem value={tag}>{tag}</MenuItem>;
					})}
				/>
			</LunaSettings>
		</Box>
	);
});
