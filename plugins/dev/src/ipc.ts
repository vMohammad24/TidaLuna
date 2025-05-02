import type { LunaUnload } from "@luna/core";
import { trace } from ".";
import { getClientMessageChannelEnum } from "./ipc.native";

export const ClientMessageChannelEnum = getClientMessageChannelEnum();

const ipcUnloads: Record<string, LunaUnload> = {};
export const startNativeIPCLog = async () => {
	for (const eventName of Object.values(await ClientMessageChannelEnum)) {
		if (eventName === "client.playback.playersignal") continue; // This event is too spammy
		ipcUnloads[eventName]?.();
		ipcUnloads[eventName] = ipcRenderer.on(eventName, (...args) => trace.log("(Native -> Render)", eventName, ...args));
	}
};
export const stopNativeIPCLog = async () => {
	// Should probably be replaced with a proper unloadSet at some point
	for (const eventName in ipcUnloads) {
		ipcUnloads[eventName]?.();
		delete ipcUnloads[eventName];
	}
};
