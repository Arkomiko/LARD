// LARD: подпуть для vitest. Корневой вход @testing-library/jest-dom тянет
// за собой типы jest (`reference types="jest"`), а тесты здесь на vitest —
// из-за этого в проекте держали лишний @types/jest.
import "@testing-library/jest-dom/vitest"
import { beforeAll } from "vitest"

beforeAll(() => {
  // Mock navigator.language
  Object.defineProperty(globalThis.navigator, "language", {
    value: "en",
    writable: true,
  })

  // Mock location
  Object.defineProperty(globalThis, "location", {
    value: {
      href: "https://signalmidi.app/",
    },
    writable: true,
  })
})
