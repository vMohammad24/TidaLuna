export type Unload = {
	(): Promise<unknown> | unknown;
	source?: string;
};

export const unloadSet = async (unloads?: Set<Unload>): Promise<void> => {
	if (unloads === undefined || unloads.size === 0) return;
	const toUnload: Unload[] = [];
	for (const unload of unloads) toUnload.push(unload);

	// Clear unloads after called to ensure their never called again
	unloads.clear();

	await Promise.all(
		toUnload.map(async (unload) => {
			try {
				// Give each unload 5s to run before timing out so we dont deadlock
				await Promise.race([unload(), new Promise((_, rej) => setTimeout(() => rej(new Error("Unload took longer than 5s to run...")), 5000))]);
			} catch (err) {
				// TODO: Reimplement modal alerts for this?
				console.error(`[Luna]`, `Error unloading ${unload.source ?? ""}.${unload.name}`, err, unload);
			}
		}),
	);
};
