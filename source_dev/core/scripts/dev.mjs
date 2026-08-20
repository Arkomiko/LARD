/**
 * Запуск LARD в разработке.
 *
 *   node core/scripts/dev.mjs lard    — программа: сервер и её окно
 *   node core/scripts/dev.mjs theme   — редактор тем: сервер и его окно
 *   node core/scripts/dev.mjs core    — только серверы, без окон
 *   node core/scripts/dev.mjs all     — программа и все редакторы разом
 *
 * Раньше на каждый случай была своя строка `concurrently` в package.json.
 * Строки жили отдельно и расходились: у «Develope ALL», например, окно
 * редактора было подписано именем сервера, а список процессов приходилось
 * держать в голове в четырёх местах сразу. Теперь процессы описаны один раз,
 * а цель — это просто набор из них.
 *
 * Всё запускается через `npm`: он всегда есть в PATH, и скрипт работает
 * одинаково хоть из `npm run dev`, хоть напрямую через `node`.
 */
import path from "node:path"
import { fileURLToPath } from "node:url"
import { concurrently } from "concurrently"

const sourceDev = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
)

/** Сервер приложения: Vite на 3000, отдаёт исходники окну программы. */
const lardServer = {
  name: "lard",
  command: "npm run dev -w app",
  prefixColor: "blue",
}

/** Окно программы: rollup собирает главный процесс, nodemon поднимает Electron. */
const lardWindow = {
  name: "lard-win",
  command: "npm run dev --prefix core/electron",
  prefixColor: "green",
}

/** Сервер редактора тем: Vite на 3100. */
const themeServer = {
  name: "theme",
  command: "npm run dev -w @lard/theme-editor",
  prefixColor: "cyan",
}

/** Окно редактора тем: общая оболочка из core/tools_shell. */
const themeWindow = {
  name: "theme-win",
  command: "npm run window -w @lard/theme-editor",
  prefixColor: "magenta",
}

/**
 * Пакеты, которые приложение видит собранными (`main: dist/index.js`), а не по
 * исходникам. Без слежения правка в `core/packages/*` до окна не доедет: Vite
 * перечитает `dist`, которого никто не пересобрал.
 *
 * Редактору тем они не нужны — он берёт только `@lard/core`, а тот отдаёт
 * исходники напрямую.
 */
const libs = [
  "@signal-app/player",
  "dialog-hooks",
  "@signal-app/community",
].map((workspace) => ({
  name: workspace.replace(/^@signal-app\//, ""),
  command: `npm run dev -w ${workspace}`,
  prefixColor: "gray",
}))

const targets = {
  lard: [...libs, lardServer, lardWindow],
  theme: [themeServer, themeWindow],
  core: [...libs, lardServer, themeServer],
  all: [...libs, lardServer, lardWindow, themeServer, themeWindow],
}

const target = process.argv[2] ?? "all"
const commands = targets[target]

if (commands === undefined) {
  console.error(
    `Не понял, что запускать: "${process.argv[2] ?? ""}". Ожидалось: ${Object.keys(targets).join(", ")}.`,
  )
  process.exit(1)
}

const { result } = concurrently(commands, {
  cwd: sourceDev,
  prefix: "name",
  // Упавший сервер уносит с собой окно: смотреть на окно, которому нечего
  // показать, всё равно незачем, а порты у нас строгие — молча переехать
  // на соседний Vite не может.
  killOthers: ["failure"],
})

result.catch(() => process.exit(1))
