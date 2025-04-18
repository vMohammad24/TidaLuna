import { ContextMenu, Page } from "@luna/lib";

const settingsPage = Page.register("Settings");
settingsPage.root.innerHTML = "HelloWorld";

ContextMenu.onOpen(({ event, contextMenu }) => {
	if (event.type === "USER_PROFILE") {
		contextMenu.addButton("Luna Settings", (e) => {
			e.preventDefault();
			settingsPage.open();
		});
	}
});
