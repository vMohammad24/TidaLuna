import { ContextMenu, Page, type LunaUnload } from "@luna/lib";

export const unloads = new Set<LunaUnload>();

const settingsPage = Page.register("Settings", unloads);
settingsPage.root.innerHTML = "HelloWorld";

ContextMenu.onOpen(({ event, contextMenu }) => {
	if (event.type === "USER_PROFILE") {
		contextMenu.addButton("Luna Settings", (e) => {
			e.preventDefault();
			settingsPage.open();
		});
	}
}, unloads);
