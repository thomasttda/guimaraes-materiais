const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPort: () => ipcRenderer.invoke('app:getPort'),
  getVersion: () => ipcRenderer.invoke('app:getVersion')
});
