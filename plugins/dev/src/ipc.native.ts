const ClientMessageChannelEnum: Record<string, string> = require("../app/shared/client/ClientMessageChannelEnum.js").default;
export const getNativeIPCEvents = () => ClientMessageChannelEnum;

const AppEventEnum: Record<string, string> = require("../app/shared/AppEventEnum.js").default;
export const getRenderIPCEvents = () => AppEventEnum;

import { ipcMain } from "electron";

const ipcListeners: Record<string, (_: any, ...args: any[]) => void> = {};
export const startRenderIpcLog = async () => {
	for (const eventName of Object.values(await AppEventEnum)) {
		// I dont want this spam when testing
		if (eventName === "playback.current.time") continue;
		ipcListeners[eventName] = (_, ...args) => console.log("[@luna/dev.native]", "Render -> Native", eventName, ...args);
		ipcMain.on(eventName, ipcListeners[eventName]);
	}
};
export const stopRenderIpcLog = async () => {
	for (const eventName in ipcListeners) {
		ipcMain.removeListener(eventName, ipcListeners[eventName]);
		delete ipcListeners[eventName];
	}
};
