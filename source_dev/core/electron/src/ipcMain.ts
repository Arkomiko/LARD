import {
  app,
  BrowserWindow,
  dialog,
  IpcMainInvokeEvent,
  ipcMain,
  nativeImage,
} from "electron"
// LARD: явный подпуть для главного процесса. Корневой entry electron-log
// выбирает вариант по process.type в рантайме, а rollup такую развилку
// схлопывает и подставляет node-вариант — он падает на log.initialize().
import log from "electron-log/main"
import { readdir, readFile, writeFile } from "fs/promises"
import { isAbsolute, join } from "path"
import { getArgument } from "./arguments"
import { signInWithBrowser } from "./auth"
import { FirebaseCredential } from "./FirebaseCredential"

interface Callbacks {
  getMainWindow: () => BrowserWindow
  onReady: () => void
  onAuthStateChanged: (isLoggedIn: boolean) => void
  onMainWindowClose: () => void
  onAuthCallback: (credential: FirebaseCredential) => void
}

const api = ({
  getMainWindow,
  onReady,
  onAuthStateChanged,
  onMainWindowClose,
  onAuthCallback,
}: Callbacks) => ({
  ready: () => {
    onReady()
  },
  showMessageBox: async (
    _e: IpcMainInvokeEvent,
    {
      message,
      buttons,
      type,
    }: {
      message: string
      buttons: string[]
      type?: "none" | "info" | "error" | "question" | "warning"
    },
  ) => {
    const result = await dialog.showMessageBox(getMainWindow(), {
      message,
      buttons,
      type,
    })
    return result.response
  },
  showOpenDialog: async () => {
    const fileObj = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "MIDI File", extensions: ["mid", "midi"] }],
    })
    if (fileObj.canceled) {
      return null
    }
    const path = fileObj.filePaths[0]
    const content = await readFile(path)
    return { path, content: content.buffer }
  },
  showOpenDirectoryDialog: async () => {
    const fileObj = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    })
    if (fileObj.canceled) {
      return null
    }
    const path = fileObj.filePaths[0]
    return path
  },
  saveFile: async (_e: IpcMainInvokeEvent, path: string, data: ArrayBuffer) => {
    await writeFile(path, Buffer.from(data))
  },
  /**
   * LARD: перетаскивание паттерна наружу — в Ableton и любой другой хост.
   *
   * Браузер такое не умеет принципиально: вкладке запрещено отдавать файлы
   * другому приложению. Умеет только главный процесс Electron через startDrag,
   * и только он — поэтому весь перенос живёт здесь.
   *
   * Файл пишем во временную папку: принимающее приложение читает его уже
   * после отпускания кнопки, так что на диске он существовать обязан.
   */
  startPatternDrag: async (
    e: IpcMainInvokeEvent,
    fileName: string,
    data: ArrayBuffer,
  ) => {
    const filePath = join(app.getPath("temp"), fileName)
    await writeFile(filePath, Buffer.from(data))

    // Иконку Electron требует непустой, иначе startDrag бросает исключение.
    const icon = nativeImage
      .createFromPath(join(__dirname, "..", "icons", "icon.png"))
      .resize({ width: 64, height: 64 })

    e.sender.startDrag({ file: filePath, icon })
  },
  readFile: async (_e: IpcMainInvokeEvent, path: string) => {
    const filePath = isAbsolute(path) ? path : join(app.getAppPath(), path)
    const content = await readFile(filePath)
    return content.buffer
  },
  searchSoundFonts: async (_e: IpcMainInvokeEvent, path: string) => {
    const files = await readdir(path, { withFileTypes: true })
    return files
      .filter((f) => f.isFile() && f.name.endsWith(".sf2"))
      .map((f) => join(f.path, f.name))
  },
  showSaveDialog: async () => {
    const fileObj = await dialog.showSaveDialog({
      filters: [{ name: "MIDI File", extensions: ["mid", "midi"] }],
    })
    if (fileObj.canceled) {
      return null
    }
    const path = fileObj.filePath
    if (!path) {
      return null
    }
    return { path }
  },
  addRecentDocument: (_e: IpcMainInvokeEvent, path: string) => {
    app.addRecentDocument(path)
  },
  getArgument: async () => getArgument(),
  openAuthWindow: async () => {
    try {
      const credential = await signInWithBrowser()
      onAuthCallback(credential)
    } catch (e) {
      log.error(e)
    }
  },
  authStateChanged: (_e: IpcMainInvokeEvent, isLoggedIn: boolean) => {
    onAuthStateChanged(isLoggedIn)
  },
  closeMainWindow: () => {
    onMainWindowClose()
  },
})

export type IpcMainAPI = ReturnType<typeof api>

export const registerIpcMain = (callbacks: Callbacks) => {
  Object.entries(api(callbacks)).forEach(([name, func]) => {
    ipcMain.handle(name, func)
  })
}
