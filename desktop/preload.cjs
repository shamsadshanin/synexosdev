const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("synexosDesktop", Object.freeze({
  getApiKeyStatus: () => ipcRenderer.invoke("synexos:get-api-key-status"),
  saveApiKey: (apiKey) => ipcRenderer.invoke("synexos:save-api-key", apiKey),
}));
