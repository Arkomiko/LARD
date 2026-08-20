import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  // Собранный редактор открывается из файла рядом с exe, а не с сервера:
  // с абсолютными путями страница ищет `/assets` в корне диска и остаётся
  // пустой.
  base: "./",
  server: {
    // Тот же адрес, что у основного приложения, но свой порт: 3000 занят им.
    host: "127.0.0.1",
    port: 3100,
    // Порт занят — останавливаемся, а не переезжаем на соседний: окно ищет
    // содержимое по этому адресу и на другом его не найдёт.
    strictPort: true,
    // Браузер сам не открываем: редактор часто запускают рядом с LARD,
    // и лишняя вкладка при каждом старте только мешает.
    open: false,
    fs: {
      // Пресеты лежат в source_dev/Tools_presets, на три уровня выше корня
      // Vite. Без явного разрешения dev-сервер откажется их отдавать.
      allow: [path.resolve(__dirname, "../../..")],
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
})
