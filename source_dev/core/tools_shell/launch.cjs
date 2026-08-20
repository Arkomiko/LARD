/**
 * Запуск окна инструмента.
 *
 * Терминал VS Code выставляет ELECTRON_RUN_AS_NODE=1 для своих служебных
 * процессов. Electron, увидев её, стартует обычным Node: окна нет, а
 * require("electron") отдаёт путь к бинарнику вместо модуля. Поэтому окно
 * запускается только отсюда, а не через `electron .` напрямую — ровно так же
 * сделано у основного приложения в `electron/scripts/launch.js`.
 *
 * Первый аргумент — адрес dev-сервера, второй — заголовок окна.
 */
const { spawn } = require("child_process")
const path = require("path")
const electronPath = require("electron")

const [url, title] = process.argv.slice(2)

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

if (url) {
  env.LARD_TOOL_URL = url
}
if (title) {
  env.LARD_TOOL_TITLE = title
}

const child = spawn(electronPath, [path.join(__dirname)], {
  stdio: "inherit",
  env,
})

child.on("close", (code) => process.exit(code ?? 0))

// Окно должно уходить вместе с запустившим его процессом: иначе при каждой
// пересборке nodemon поднимает новое, а старое остаётся висеть на экране.
const stop = () => {
  if (child.exitCode === null && !child.killed) {
    child.kill()
  }
}

process.on("SIGINT", stop)
process.on("SIGTERM", stop)
process.on("SIGHUP", stop)
process.on("exit", stop)
