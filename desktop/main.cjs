const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  safeStorage,
  shell,
  utilityProcess,
} = require("electron");
const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const APP_ID = "com.synexos.energyoperations";
const REPOSITORY_URL = "https://github.com/shamsadshanin/synexosdev";
let mainWindow = null;
let apiProcess = null;

app.setName("SynexOS");
app.setAppUserModelId(APP_ID);

function apiKeyPath() {
  return path.join(app.getPath("userData"), "gemini-api-key.bin");
}

function readStoredApiKey() {
  if (!safeStorage.isEncryptionAvailable() || !existsSync(apiKeyPath())) return "";
  try {
    return safeStorage.decryptString(readFileSync(apiKeyPath()));
  } catch {
    return "";
  }
}

function isTrustedRenderer(event) {
  return mainWindow && event.sender === mainWindow.webContents;
}

function registerSettingsHandlers() {
  ipcMain.handle("synexos:get-api-key-status", (event) => {
    if (!isTrustedRenderer(event)) throw new Error("Untrusted application window.");
    return Boolean(readStoredApiKey() || process.env.GEMINI_API_KEY);
  });

  ipcMain.handle("synexos:save-api-key", (event, value) => {
    if (!isTrustedRenderer(event)) throw new Error("Untrusted application window.");
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Windows encrypted storage is unavailable on this device.");
    }
    if (typeof value !== "string" || value.trim().length < 12 || value.trim().length > 500) {
      throw new Error("Enter a valid Gemini API key.");
    }
    writeFileSync(apiKeyPath(), safeStorage.encryptString(value.trim()));
    return { configured: true, restartRequired: true };
  });
}

function startLocalApi() {
  const appPath = app.getAppPath();
  const serverPath = path.join(appPath, "dist", "server.cjs");
  const apiKey = readStoredApiKey() || process.env.GEMINI_API_KEY;
  const env = {
    ...process.env,
    NODE_ENV: "production",
    SYNEXOS_DESKTOP: "1",
    SYNEXOS_DIST_PATH: path.join(appPath, "dist"),
    HOST: "127.0.0.1",
    PORT: "0",
  };
  if (apiKey) env.GEMINI_API_KEY = apiKey;
  else delete env.GEMINI_API_KEY;

  apiProcess = utilityProcess.fork(serverPath, [], {
    serviceName: "SynexOS Local Energy Engine",
    stdio: ["ignore", "pipe", "pipe"],
    env,
  });

  return new Promise((resolve, reject) => {
    let output = "";
    let settled = false;
    const timeout = setTimeout(() => finish(new Error("The local energy service did not start in time.")), 20000);
    const finish = (error, url) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(url);
    };

    apiProcess.stdout?.on("data", (chunk) => {
      output += chunk.toString();
      const ready = output.match(/SYNEXOS_SERVER_READY=(http:\/\/127\.0\.0\.1:\d+)/);
      if (ready) finish(null, ready[1]);
    });
    apiProcess.stderr?.on("data", (chunk) => console.error(chunk.toString()));
    apiProcess.once("error", (error) => finish(error));
    apiProcess.once("exit", (code) => {
      if (!settled) finish(new Error(`The local energy service exited before startup (code ${code}).`));
    });
  });
}

function setNativeMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: "SynexOS",
      submenu: [
        {
          label: "About SynexOS",
          click: () => dialog.showMessageBox(mainWindow, {
            title: "About SynexOS",
            message: "SynexOS Energy Operations",
            detail: `Version ${app.getVersion()} · Local-first energy scheduling for Windows.`,
          }),
        },
        { type: "separator" },
        { role: "quit", label: "Exit" },
      ],
    },
    { label: "Edit", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
    { label: "View", submenu: [{ role: "reload" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }] },
    { label: "Help", submenu: [{ label: "SynexOS on GitHub", click: () => shell.openExternal(REPOSITORY_URL) }] },
  ]));
}

async function createMainWindow() {
  const serverUrl = await startLocalApi();
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 960,
    minHeight: 680,
    show: false,
    backgroundColor: "#f5f7f4",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.maximize();
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  await mainWindow.loadURL(serverUrl);
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.on("before-quit", () => apiProcess?.kill());
  app.on("window-all-closed", () => app.quit());

  app.whenReady().then(async () => {
    registerSettingsHandlers();
    setNativeMenu();
    try {
      await createMainWindow();
    } catch (error) {
      dialog.showErrorBox("SynexOS could not start", error instanceof Error ? error.message : String(error));
      app.quit();
    }
  });
}
