const { app, BrowserWindow, ipcMain, net } = require('electron');
const path = require('path');
const { startServer } = require('./src/server');

let mainWindow;
let serverPort;

function getIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'icon.ico');
  }
  return path.join(__dirname, 'icon.ico');
}

if (process.platform === 'win32') {
  app.setAppUserModelId('com.guimaraes.materiais.desktop');
}

async function createWindow() {
  serverPort = await startServer();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'Guimarães Materiais',
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  mainWindow.loadURL(`http://localhost:${serverPort}/admin/login`);

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

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
