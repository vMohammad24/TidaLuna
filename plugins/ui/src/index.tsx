import { ContextMenu, Page, type LunaUnload } from "@luna/lib";
import React from "react";
import { createRoot } from "react-dom/client";

export const unloads = new Set<LunaUnload>();

const settingsPage = Page.register("LunaSettings", unloads);
createRoot(settingsPage.root).render(<>Hello World</>);

ContextMenu.onOpen(({ event, contextMenu }) => {
	if (event.type === "USER_PROFILE") {
		contextMenu.addButton("Luna Settings", (e) => {
			e.preventDefault();
			settingsPage.open();
		});
	}
}, unloads);
