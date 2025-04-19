import { redux, unloads, type LunaUnload } from "@luna/lib";

import { createRoot, type Root } from "react-dom/client";

export class Page {
	private static openPage?: Page;
	private static readonly pages: Record<string, Page> = {};
	public static register(name: string, unloads: Set<LunaUnload>) {
		return (this.pages[name] ??= new this(name, unloads));
	}

	public readonly root: HTMLDivElement;
	public readonly rootId;
	private reactRoot?: Root;

	private constructor(
		public readonly name: string,
		private readonly unloads: Set<LunaUnload>,
	) {
		this.rootId = `luna-page-${this.name}`;
		this.root = <HTMLDivElement>document.getElementById(this.rootId) ?? document.createElement("div");
		this.unloads.add(this.root.remove.bind(this.root));
		this.unloads.add(() => {
			delete Page.pages[this.name];
		});

		// If we are already on the page on load then add it to the DOM
		// This is mostly to facilitate live reloading
		if (location.search === `?${this.name}`) this.addtoDOM();
	}

	render(component: React.ReactNode) {
		if (this.reactRoot === undefined) {
			this.reactRoot = createRoot(this.root);
			this.unloads.add(this.reactRoot.unmount.bind(this.reactRoot));
		}
		this.reactRoot.render(component);
	}

	private addtoDOM() {
		const notFound = document.querySelector<HTMLElement>(`[class^="_pageNotFoundError_"]`);
		if (notFound) {
			notFound.style.display = "none";
			this.root.remove(); // Ensure root isnt already on page
			Page.openPage = this;
			notFound.insertAdjacentElement("afterend", this.root);
		}
	}

	static {
		redux.intercept<{ search: string }>("router/NAVIGATED", unloads, (payload) => {
			Page.openPage?.root.remove();
			Page.openPage = undefined;
			// payload.search = `?name`
			const pageName = payload.search.slice(1);
			if (pageName in this.pages) {
				const page = this.pages[pageName];
				setTimeout(page.addtoDOM.bind(page));
			}
		});
	}

	open() {
		redux.actions["router/PUSH"]({
			pathname: "/not-found",
			search: this.name,
			replace: true,
		});
	}
}
