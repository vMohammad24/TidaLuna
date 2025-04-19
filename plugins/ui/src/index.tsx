import React from "react";

import { ContextMenu, type LunaUnload } from "@luna/lib";

import { Page } from "./classes/Page";
import { LunaSettings } from "./LunaSettings";

export const unloads = new Set<LunaUnload>();

const settingsPage = Page.register("LunaSettings", unloads);
settingsPage.render(<LunaSettings />);

ContextMenu.onOpen(unloads, ({ event, contextMenu }) => {
	if (event.type === "USER_PROFILE") {
		contextMenu.addButton("Luna Settings", (e) => {
			e.preventDefault();
			settingsPage.open();
		});
	}
});
