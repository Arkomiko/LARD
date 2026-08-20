import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig, loadEnv } from "vite"
import checker from "vite-plugin-checker"
import svgr from "vite-plugin-svgr"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.join(process.cwd(), ".."), "FIREBASE_")

  return {
    plugins: [
      checker({
        typescript: true,
      }),
      react(),
      svgr({
        include: "**/*.svg",
        svgrOptions: {
          plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
          exportType: "default",
        },
      }),
      {
        name: "rewrite-path",
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url === "/home") {
              req.url = "/community"
            }
            if (req.url === "/profile") {
              req.url = "/community"
            }
            if (req.url?.startsWith("/users/")) {
              req.url = "/community"
            }
            if (req.url?.startsWith("/songs/")) {
              req.url = "/community"
            }
            next()
          })
        },
      },
    ],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "edit.html"),
          auth: path.resolve(__dirname, "auth.html"),
          community: path.resolve(__dirname, "community.html"),
        },
      },
      minify: false,
      sourcemap: true,
    },
    publicDir: "public",
    server: {
      // LARD: явно слушаем IPv4-петлю. По умолчанию Vite биндит только [::1],
      // и Chrome, резолвящий localhost в 127.0.0.1, получает ERR_CONNECTION_REFUSED.
      host: "127.0.0.1",
      port: 3000,
      // Порт занят — останавливаемся, а не переезжаем на соседний:
      // окно ищет содержимое по этому адресу и на другом его не найдёт.
      strictPort: true,
      // LARD: браузер не открываем — приложение живёт в своём окне.
      // Сервер здесь только раздаёт исходники этому окну.
      open: false,
      fs: {
        // LARD: пресеты лежат в source_dev/Tools_presets, то есть на уровень
        // выше корня Vite (source_dev/app/). Без явного разрешения dev-сервер
        // отказывается их отдавать и темы с языками не грузятся.
        allow: [path.resolve(__dirname, "..")],
      },
    },
    resolve: {
      alias: {
        react: path.resolve("../node_modules/react"),
      },
      dedupe: [
        "react",
        "react-dom",
        "firebase",
        "firebase/app",
        "firebase/auth",
        "firebase/firestore",
        "firebase/functions",
      ],
    },
    envDir: "..",
    define: {
      "process.env": env,
    },
    optimizeDeps: {
      include: ["firebase/app", "firebase/firestore"],
    },
  }
})
