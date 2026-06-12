const { app, BrowserWindow, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { startServer } = require('./src/server');

let mainWindow;
let serverPort;

function getAppIcon() {
  try {
    if (app.isPackaged) {
      return nativeImage.createFromPath(path.join(process.resourcesPath, 'icon.ico'));
    }
    return nativeImage.createFromPath(path.join(__dirname, 'icon.ico'));
  } catch {
    return undefined;
  }
}

app.on('ready', async () => {
  serverPort = await startServer();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'Guimarães Materiais',
    icon: getAppIcon(),
    backgroundColor: '#f3f4f6',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  mainWindow.loadURL(`http://localhost:${serverPort}/admin/login`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('app:getPort', () => serverPort);
ipcMain.handle('app:getVersion', () => app.getVersion());
