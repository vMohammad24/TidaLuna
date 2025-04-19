import React from "react";

import { ContextMenu, type LunaUnload } from "@luna/lib";

import { Page } from "./classes/Page";

import { ThemeProvider } from "@mui/material/styles";

import { LunaSettings } from "./LunaSettings";
import { lunaMuiTheme } from "./LunaTheme";

export const unloads = new Set<LunaUnload>();

const settingsPage = Page.register("LunaSettings", unloads);
// thx @n1ckoates re CoverTheme <3
settingsPage.pageStyles.background = `
radial-gradient(ellipse at top left, rgba(88, 10, 82, 0.5), transparent 70%),
radial-gradient(ellipse at center left, rgba(18, 234, 246, 0.5), transparent 70%),
radial-gradient(ellipse at bottom left, rgba(205, 172, 191, 0.5), transparent 70%),
radial-gradient(ellipse at top right, rgba(139, 203, 235, 0.5), transparent 70%),
radial-gradient(ellipse at center right, rgba(98, 103, 145, 0.5), transparent 70%),
radial-gradient(ellipse at bottom right, rgba(47, 48, 78, 0.5), transparent 70%)`;

settingsPage.render(
	<ThemeProvider theme={lunaMuiTheme}>
		<LunaSettings />
	</ThemeProvider>,
);

ContextMenu.onOpen(unloads, ({ event, contextMenu }) => {
	if (event.type === "USER_PROFILE") {
		contextMenu.addButton("Luna Settings", (e) => {
			e.preventDefault();
			settingsPage.open();
		});
	}
});
