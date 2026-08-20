// LARD: запуск Electron с принудительно снятой переменной ELECTRON_RUN_AS_NODE.
//
// Терминал VS Code выставляет её в единицу для своих служебных процессов.
// Electron, увидев её, стартует как обычный Node: окна нет, а require("electron")
// возвращает строку с путём к бинарнику вместо модуля — из-за чего падает
// первое же обращение к app.getVersion().
//
// Запускать через этот файл, а не через `electron .` напрямую.
const { spawn } = require("child_process")
const electronPath = require("electron")

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const child = spawn(electronPath, ["."], { stdio: "inherit", env })
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
