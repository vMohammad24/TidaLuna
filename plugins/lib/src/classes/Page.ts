import { actions, intercept } from "../redux";
export class Page {
	private static readonly pages: Record<string, Page> = {};
	public static register(name: string) {
		return (this.pages[name] ??= new this(name));
	}

	public readonly root: HTMLDivElement = document.createElement("div");

	private constructor(public readonly name: string) {}

	static {
		intercept<{ search: string }>("router/NAVIGATED", (payload) => {
			const pageName = payload.search.slice(1);
			// payload.search = `?name`
			if (pageName in this.pages) {
				const page = this.pages[pageName];
				// Queue a intercept to trigger on navigating away to remove the page
				intercept("router/NAVIGATED", () => page.root.remove(), true);
				setTimeout(() => {
					const notFound = document.querySelector<HTMLElement>(`[class^="_pageNotFoundError_"]`);
					if (notFound) {
						notFound.style.display = "none";
						page.root.remove(); // Ensure root isnt already on page
						notFound.insertAdjacentElement("afterend", page.root);
					}
				});
			}
		});
	}

	open() {
		actions["router/PUSH"]({
			pathname: "/not-found",
			search: this.name,
			replace: true,
		});
	}
}
