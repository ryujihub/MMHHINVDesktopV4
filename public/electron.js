const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

// Ensure logs go to a file in production so we can debug startup issues
try {
  const logsDir = app.getPath('logs');
  try { fs.mkdirSync(logsDir, { recursive: true }); } catch (_) {}
  const logFile = path.join(logsDir, 'main.log');
  const logLine = (msg) => {
    try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`); } catch (_) {}
  };
  console.log = ((orig) => (...args) => { orig(...args); logLine(args.map(String).join(' ')); })(console.log);
  console.error = ((orig) => (...args) => { orig(...args); logLine(`ERROR: ${args.map(String).join(' ')}`); })(console.error);
} catch (_) {
  // ignore logging setup errors
}

async function createWindow() {
  console.log('Creating window...');
  console.log('__dirname:', __dirname);
  console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
  console.log('app.isPackaged:', app.isPackaged);
  
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: '#111111',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    icon: path.join(__dirname, 'icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  if (isDev) {
    try {
      await mainWindow.loadURL('http://localhost:3000');
      mainWindow.webContents.openDevTools();
    } catch (devErr) {
      console.error('Dev server not available. Falling back to local build.', devErr.message);
      const fallbackPaths = [
        path.join(__dirname, '..', 'build', 'index.html'),
        path.join(__dirname, 'build', 'index.html'),
        path.join(__dirname, 'index.html')
      ];
      let loaded = false;
      for (const p of fallbackPaths) {
        try {
          console.log(`Attempting dev fallback load from: ${p}`);
          const fileUrl = pathToFileURL(p).toString();
          console.log('Dev fallback file URL:', fileUrl);
          await mainWindow.loadURL(fileUrl);
          loaded = true;
          break;
        } catch (e) {
          console.error('Failed dev fallback path:', p, e.message);
        }
      }
      if (!loaded) {
        throw new Error('Could not load UI from dev server or local build.');
      }
    }
  } else {
    // Fix: Robust path resolution for packaged app
    const appPath = app.getAppPath();
    const candidatePaths = [
      path.join(appPath, 'build', 'index.html'),          // resources/app.asar/build/index.html
      path.join(appPath, 'index.html'),                   // resources/app.asar/index.html
      path.join(__dirname, '..', 'build', 'index.html'),  // resources/app.asar/public/../build/index.html
      path.join(__dirname, 'build', 'index.html'),        // resources/app.asar/public/build/index.html
      path.join(process.resourcesPath, 'app.asar', 'build', 'index.html'),
      path.join(process.resourcesPath, 'build', 'index.html')
    ];

    const existing = candidatePaths.filter(p => {
      try { return fs.existsSync(p); } catch (_) { return false; }
    });

    console.log('Packaged candidate index.html paths (existing first):');
    existing.forEach(p => console.log('  ✔', p));
    candidatePaths.filter(p => !existing.includes(p)).forEach(p => console.log('  ✖', p));

    if (existing.length === 0) {
      console.error('No valid index.html found in any candidate path.');
      throw new Error('index.html not found in packaged resources');
    }

    let loaded = false;
    for (const indexPath of existing) {
      try {
        console.log(`Attempting to load from: ${indexPath}`);
        const fileUrl = pathToFileURL(indexPath).toString();
        console.log('Packaged file URL:', fileUrl);
        await mainWindow.loadURL(fileUrl);
        console.log(`✅ Successfully loaded from: ${indexPath}`);
        loaded = true;
        break;
      } catch (error) {
        console.error(`❌ Failed to load from: ${indexPath}`, error.message);
      }
    }

    if (!loaded) {
      console.error('❌ Failed to load from all existing paths!');
      throw new Error('Could not load index.html from any existing location');
    }
  }

  // Show window when ready, with multiple fallbacks
  let showed = false;
  const tryShow = () => {
    if (!showed && mainWindow && !mainWindow.isDestroyed()) {
      showed = true;
      mainWindow.show();
      mainWindow.focus();
    }
  };

  mainWindow.once('ready-to-show', () => {
    console.log('Event: ready-to-show');
    tryShow();
  });

  // If renderer finishes loading but ready-to-show didn't fire
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Event: did-finish-load');
    tryShow();
  });

  // Last resort: show after a timeout
  setTimeout(() => {
    console.log('Fallback timeout reached, forcing show');
    tryShow();
  }, 8000);

  // Helpful diagnostics for failures/crashes
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc, validatedURL) => {
    console.error('did-fail-load:', errorCode, errorDesc, validatedURL || '');
    dialog.showErrorBox('Failed to load UI', `${errorDesc} (code ${errorCode})\nURL: ${validatedURL || 'file://index.html'}`);
  });

  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    console.error('Renderer process gone:', JSON.stringify(details));
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.error('Window became unresponsive');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Import Products',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('import-products');
          }
        },
        {
          label: 'Export Report',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('export-report');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Single instance lock: avoid multiple background Electron processes
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  console.log('Another instance detected, quitting this one.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  // App event listeners
  app.whenReady().then(() => createWindow());
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for file operations
ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('save-file', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});
