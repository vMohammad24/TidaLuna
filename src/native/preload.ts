import { contextBridge, ipcRenderer, webFrame } from "electron";

// Allow render side to execute invoke
contextBridge.exposeInMainWorld("LunaNative", {
	invoke: ipcRenderer.invoke,
});

// Load Luna bundle code
ipcRenderer.invoke("__Luna.loadBundle").then((bundle) => {
	webFrame.executeJavaScript(bundle, true, (...res) => console.log("__Luna.loadBundle", ...res));
});

// Load original tidal code
ipcRenderer.invoke("__Luna.originalPreload").then(require);
