const { app, BrowserWindow, session } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "GreenBrowser - EFPPR Prototype",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Disabling webSecurity inside Chromium allows our iframes to bypass some strict X-Frame-Options for testing!
    },
    autoHideMenuBar: true
  });

  // Check if we are running in Dev Mode (Vite server bounds) or Packed Mode
  const isDev = !app.isPackaged;

  if (isDev) {
    console.log("Loading Vite Dev Environment...");
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Handle cross-origin iframe embedding gracefully
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const newHeaders = { ...details.responseHeaders };
    delete newHeaders['X-Frame-Options'];
    delete newHeaders['x-frame-options'];

    callback({
      responseHeaders: {
        ...newHeaders,
        'Content-Security-Policy': ["default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-src *;"]
      }
    });
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
