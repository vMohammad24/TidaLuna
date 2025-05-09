import { ftch } from "@luna/core";
import React from "react";

import { components } from "@octokit/openapi-types";
type GitHubRelease = components["schemas"]["release"];

import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

import { getPackage, updateLuna } from "@luna/lib.native";

import { useConfirm } from "material-ui-confirm";
import { LunaButton, LunaSettings, SpinningButton } from "../../components";

const pkg = await getPackage();

export const LunaClientUpdate = React.memo(() => {
	const confirm = useConfirm();
	const [releases, setReleases] = React.useState<GitHubRelease[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [selectedRelease, setSelectedRelease] = React.useState<string>(pkg.version);

	const fetchReleases = async () => {
		setLoading(true);
		const releases = await ftch.json<GitHubRelease[]>("https://api.github.com/repos/Inrixia/TidaLuna/releases").finally(() => setLoading(false));
		setReleases(releases);
		if (selectedRelease === null && releases.length > 0) setSelectedRelease(releases[0].tag_name);
	};

	React.useEffect(() => {
		fetchReleases();
	}, []);

	let action;
	let desc;
	if (selectedRelease !== pkg.version) {
		action = "Update Client";
		desc = `Update to ${selectedRelease}? You will need to restart the client.`;
	} else {
		action = "Reinstall Client";
		desc = `Reinstall ${selectedRelease}? You will need to restart the client.`;
	}

	return (
		<LunaSettings
			title="Client Updates"
			desc="Select release tag & update client"
			titleChildren={<SpinningButton title="Fetch releases" loading={loading} onClick={fetchReleases} />}
			direction="row"
			alignItems="center"
		>
			<LunaButton
				children={action}
				tooltip={desc}
				onClick={async () => {
					const result = await confirm({ title: action, description: desc, confirmationText: action });
					if (!result.confirmed) return;
					const releaseUrl = releases.find((r) => r.tag_name === selectedRelease)?.assets[0].browser_download_url;
					if (releaseUrl === undefined) throw new Error("Release URL not found");
					await updateLuna(releaseUrl);
				}}
			/>
			<Select
				fullWidth
				sx={{ flex: 1 }}
				value={selectedRelease}
				onChange={(e) => setSelectedRelease(e.target.value)}
				children={releases.map((release) => {
					return <MenuItem value={release.tag_name}>{`${release.tag_name}${release.prerelease ? "-dev" : ""}`}</MenuItem>;
				})}
			/>
		</LunaSettings>
	);
});
