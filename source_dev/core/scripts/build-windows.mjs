/**
 * Сборка готовых продуктов LARD под Windows.
 *
 *   node scripts/build-windows.mjs lard    — только LARD.exe
 *   node scripts/build-windows.mjs theme   — только «LARDed - Theme.exe»
 *   node scripts/build-windows.mjs all     — всё сразу
 *
 * Результат складывается в `app_r/<версия>/Windows_Standalone/`: сама
 * программа в корне этой папки, редакторы — в `Tools/`. Рядом кладутся папки
 * пресетов, чтобы собранная программа читала темы, языки и раскладки так же,
 * как в разработке — из файлов рядом с собой.
 *
 * Сборка идёт в два шага: сначала обычная сборка веб-части, потом упаковка её
 * в окно Electron. Оба шага одинаковы для программы и для инструментов —
 * отличается только то, что упаковывается.
 */
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const sourceDev = path.resolve(here, "..", "..")
const repo = path.resolve(sourceDev, "..")

const version = JSON.parse(
  fs.readFileSync(path.join(sourceDev, "package.json"), "utf8"),
).version

const outRoot = path.join(repo, "app_r", version, "Windows_Standalone")

/**
 * Заготовки пресетов. В сборку они не компилируются — просто копируются в
 * `Data/` рядом с программой, чтобы было с чего начинать.
 */
const presetFolders = ["Theme", "Language", "Workspace"]

const run = (command, args, cwd) => {
  console.log(`\n> ${command} ${args.join(" ")}`)
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  })

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} — выход с кодом ${result.status}`,
    )
  }
}

const npm = (args, cwd = sourceDev) => run("npm", args, cwd)

const replaceDir = (from, to) => {
  fs.rmSync(to, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.cpSync(from, to, { recursive: true })
}

/**
 * Единственный подкаталог сборки: упаковщик кладёт результат в папку с именем
 * вида `LARD-win32-x64`, и угадывать это имя незачем.
 */
const onlyDirIn = (dir) => {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())

  if (entries.length !== 1) {
    throw new Error(
      `В ${dir} ожидалась одна папка сборки, найдено: ${entries.length}`,
    )
  }

  return path.join(dir, entries[0].name)
}

/** Заготовки пресетов кладём в `Data/` рядом с программой. */
const copyPresets = () => {
  for (const folder of presetFolders) {
    const from = path.join(sourceDev, "Tools_presets", folder)
    if (fs.existsSync(from)) {
      replaceDir(from, path.join(outRoot, "Data", folder))
    }
  }
}

const buildLard = () => {
  console.log("\n=== LARD ===")

  // Веб-часть в вариант для окна: без сервис-воркера и с путями под file://.
  npm(["run", "build:electron", "-w", "app"])
  replaceDir(
    path.join(sourceDev, "app", "dist"),
    path.join(sourceDev, "core", "electron", "dist_renderer"),
  )

  // Оболочка окна и упаковка. Собственный package-lock, поэтому --prefix.
  npm(["run", "package", "--prefix", "core/electron"])

  const packaged = onlyDirIn(path.join(sourceDev, "core", "electron", "out"))
  fs.mkdirSync(outRoot, { recursive: true })

  for (const entry of fs.readdirSync(packaged, { withFileTypes: true })) {
    const from = path.join(packaged, entry.name)
    const to = path.join(outRoot, entry.name)
    fs.rmSync(to, { recursive: true, force: true })
    fs.cpSync(from, to, { recursive: true })
  }

  copyPresets()
  console.log(`\nГотово: ${path.join(outRoot, "LARD.exe")}`)
}

/**
 * Инструменты собираются одинаково: веб-часть — в `renderer` оболочки, потом
 * оболочка упаковывается под своим именем.
 *
 * Упаковщик вызывается напрямую, а не через командную строку: в имени продукта
 * есть пробелы, а в списке исключений — скобки, и командная оболочка Windows
 * разбирает такую строку по-своему.
 */
const buildTool = async ({ workspace, folder, product }) => {
  console.log(`\n=== ${product} ===`)

  npm(["run", "build", "-w", workspace])

  const shell = path.join(sourceDev, "core", "tools_shell")
  replaceDir(
    path.join(sourceDev, "app", "src_Tools", folder, "dist"),
    path.join(shell, "renderer"),
  )

  const out = path.join(shell, "out")
  fs.rmSync(out, { recursive: true, force: true })

  const { packager } = await import("@electron/packager")
  await packager({
    dir: shell,
    name: product,
    platform: "win32",
    arch: "x64",
    out,
    overwrite: true,
    ignore: [/^\/out($|\/)/, /^\/README\.md$/],
  })

  const toolsDir = path.join(outRoot, "Tools")
  replaceDir(onlyDirIn(out), path.join(toolsDir, product))

  console.log(`\nГотово: ${path.join(toolsDir, product, `${product}.exe`)}`)
}

const targets = {
  lard: buildLard,
  theme: () =>
    buildTool({
      workspace: "@lard/theme-editor",
      folder: "src_Theme",
      product: "[LARD] Theme Editor",
    }),
}

const target = process.argv[2]

if (target === "all") {
  for (const build of Object.values(targets)) {
    await build()
  }
} else if (targets[target] !== undefined) {
  await targets[target]()
} else {
  console.error(
    `Не понял, что собирать: "${target ?? ""}". Ожидалось: ${Object.keys(targets).join(", ")}, all.`,
  )
  process.exit(1)
}
