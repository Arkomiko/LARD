import { defineConfig } from "vitest/config";

// Vite собирает интерфейс в папку dist/, оболочка копирует её к MiliPlain.exe.
// Здесь же настроены тесты (Vitest).
export default defineConfig({
  // Относительные пути: страница открывается из папки рядом с exe, а не с сайта.
  base: "./",
  server: {
    // Оболочка в режиме разработки (--ui-dev) ждёт интерфейс именно на этом порту.
    // strictPort: если порт занят, лучше явная ошибка, чем тихий переезд на другой.
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2023",
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
