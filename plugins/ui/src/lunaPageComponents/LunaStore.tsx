import React from "react";

import { type PluginPackage } from "@luna/core";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

import IconButton from "@mui/material/IconButton";
import { LunaAuthorDisplay } from "../components";
import { ReloadButton } from "./ReloadButton";

interface StorePackage extends PluginPackage {
	plugins: string[];
}

export const LunaStore = React.memo(({ url, onRemove }: { url: string; onRemove: () => void }) => {
	const [loading, setLoading] = React.useState(false);
	const [loadError, setLoadError] = React.useState<string | undefined>(undefined);
	const [pkg, setPackage] = React.useState<StorePackage | undefined>(undefined);

	const disabled = loading; // Disable controls while loading

	const fetchPackage = React.useCallback(async () => {
		setLoading(true);
		setLoadError(undefined);
		try {
			const response = await fetch(`${url}/store.json`);
			if (!response.ok) throw new Error(`Failed to fetch package: ${response.statusText}`);
			const data = await response.json();
			setPackage(data);
		} catch (error: any) {
			console.error("Error fetching package:", error);
			setLoadError(error.message || "Unknown error occurred");
			setPackage(undefined); // Clear package on error
		} finally {
			setLoading(false);
		}
	}, [url]);

	React.useEffect(() => {
		fetchPackage();
	}, [fetchPackage]); // Depend on the memoized fetch function

	if (pkg === undefined && !loading && !loadError) return null; // Don't render anything until initial load attempt
	if (loading && !pkg) return <Typography>Loading store...</Typography>; // Show loading indicator if still loading initially

	const name = pkg?.name ?? "Unknown Store";
	const author = pkg?.author;
	const desc = pkg?.description;

	return (
		<Stack
			spacing={1}
			sx={{
				borderRadius: 3,
				backgroundColor: "rgba(0, 0, 0, 0.10)",
				boxShadow: loadError ? "0 0 10px rgba(255, 0, 0, 0.70)" : "none",
				padding: 2,
				paddingTop: 1,
				paddingBottom: 1,
			}}
		>
			<Box>
				<Stack direction="row" spacing={1}>
					<Box sx={{ minWidth: 85 }}>
						<Tooltip title={url} children={<Typography sx={{ marginTop: 0.5 }} variant="h6" children={name} />} />
					</Box>
					<Tooltip title="Reload store" children={<ReloadButton spin={loading} disabled={disabled} onClick={fetchPackage} />} />
					{
						<Tooltip
							title="Uninstall store"
							children={<IconButton disabled={disabled} color="error" children={<DeleteForeverIcon />} onClick={onRemove} />}
						/>
					}
					{loadError && (
						<Typography
							variant="caption"
							sx={{
								color: "white",
								fontWeight: 500,
								backgroundColor: "rgba(256, 0, 0, 0.5)",
								padding: 1,
								borderRadius: 1,
								paddingTop: 1.5,
							}}
							children={loadError}
						/>
					)}
					<Box sx={{ flexGrow: 1 }} /> {/* This pushes the author section to the right */}
					{author && <LunaAuthorDisplay author={author} />}
				</Stack>
				{desc && <Typography variant="subtitle2" gutterBottom children={desc} />}
			</Box>
		</Stack>
	);
});
