import { LunaPlugin, type PluginPackage } from "@luna/core";

import React, { useEffect, useState } from "react";

import { LunaPluginHeader } from "../PluginsTab/LunaPluginHeader";

import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

export const LunaStorePlugin = React.memo(({ url, package: pkg, loadError }: { url: string; package?: PluginPackage; loadError?: string }) => {
	const [isHovered, setIsHovered] = useState(false);
	const [isInstalled, setIsInstalled] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!pkg) return;
		const plugin = LunaPlugin.plugins[pkg.name];
		setIsInstalled(plugin?.installed ?? false);
	}, [pkg]);

	if (!pkg && !loadError) return null;

	const version = url.startsWith("http://127.0.0.1") ? `${pkg?.version ?? ""} [DEV]` : pkg?.version;

	const handleClick = async () => {
		if (!pkg || isLoading) return;

		setIsLoading(true);
		try {
			const plugin = await LunaPlugin.fromStorage({ url, package: pkg });

			if (isInstalled) {
				await plugin.uninstall();
				setIsInstalled(false);
			} else {
				await plugin.install();
				setIsInstalled(true);
			}
		} catch (error) {
			console.error("Failed to install/uninstall plugin:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ButtonBase
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			disabled={isLoading}
			sx={{
				position: "relative", // Needed for absolute positioning of children
				borderRadius: 2,
				backgroundColor: `rgba(0, 0, 0, ${!isHovered ? 0.2 : 0.5})`,
				padding: 2,
				paddingBottom: 1,
				paddingTop: 1,
				boxShadow: 5,
				transition: "opacity 0.3s ease-in-out",
				opacity: isInstalled && !isHovered ? 0.5 : 1, // Keep installed opacity logic
				overflow: "hidden",
				width: "100%",
			}}
			style={{ textAlign: "left" }}
			onClick={handleClick}
		>
			<LunaPluginHeader
				sx={{ transition: "opacity 0.3s ease-in-out", opacity: isHovered ? 0.2 : 1, width: "100%" }}
				name={pkg?.name ?? "Unknown Plugin"}
				version={version}
				loadError={loadError}
				author={pkg?.author}
				desc={pkg?.description}
			/>
			<Typography
				sx={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					opacity: isHovered ? 1 : 0,
					transition: "opacity 0.3s ease-in-out",
					fontWeight: "bold",
					color: isInstalled ? "red" : "green",
					borderRadius: 2,
					padding: 1,
					pointerEvents: "none",
				}}
				children={isLoading ? "Loading..." : isInstalled ? "Uninstall" : "Install"}
			/>
		</ButtonBase>
	);
});
