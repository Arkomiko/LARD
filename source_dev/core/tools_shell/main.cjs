/**
 * Окно для инструмента LARD.
 *
 * Одна оболочка на все редакторы из `Tools`: они отличаются только тем, что
 * показывают, а окно, меню и поведение у них общие. Что именно загрузить,
 * говорят переменные окружения — так одна и та же оболочка работает и в
 * отладке (адрес dev-сервера), и в собранном виде (файлы рядом с exe).
 *
 * Переменные:
 *   LARD_TOOL_URL   — адрес dev-сервера инструмента;
 *   LARD_TOOL_TITLE — заголовок окна;
 *   без них берётся `renderer/index.html` рядом с оболочкой.
 */
const { app, BrowserWindow, Menu, shell } = require("electron")
const path = require("path")

const title = process.env.LARD_TOOL_TITLE || "LARD Tools"
const url = process.env.LARD_TOOL_URL
const devtools = process.env.LARD_DEVTOOLS === "1"

/**
 * Сколько ждём dev-сервер. Окно и сервер поднимаются одновременно, и окно
 * почти всегда успевает первым — поэтому не падаем, а пробуем ещё раз.
 */
const RETRY_LIMIT = 40
const RETRY_DELAY = 500

const loadWithRetry = async (window, attempt = 0) => {
  try {
    await window.loadURL(url)
  } catch (error) {
    if (attempt >= RETRY_LIMIT || window.isDestroyed()) {
      throw error
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
    await loadWithRetry(window, attempt + 1)
  }
}

const createWindow = async () => {
  // Меню окну инструмента не нужно: все действия — в самом редакторе, а
  // стандартное File/Edit/View только сбивает с толку.
  Menu.setApplicationMenu(null)

  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title,
    backgroundColor: "#111111",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  // Ссылки наружу открывает система, а не окно инструмента: подменить
  // содержимое редактора чужой страницей нельзя.
  window.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target)
    return { action: "deny" }
  })

  if (url) {
    await loadWithRetry(window)
  } else {
    await window.loadFile(path.join(__dirname, "renderer", "index.html"))
  }

  if (devtools) {
    window.webContents.openDevTools({ mode: "detach" })
  }
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => app.quit())

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
