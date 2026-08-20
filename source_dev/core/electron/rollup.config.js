import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import nodeResolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"

export default [
  {
    input: "src/preload.ts",
    output: {
      file: "dist/preload.js",
      format: "cjs",
      // LARD: карты кода. Без них отладчик VS Code останавливается в собранном
      // dist/preload.js, а не в исходнике на TypeScript. В готовый продукт
      // карты не попадают — они отсеяны в forge.config.js.
      sourcemap: true,
    },
    external: ["electron"],
    plugins: [nodeResolve({ preferBuiltins: true }), commonjs(), typescript()],
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "cjs",
      // LARD: см. выше — карты кода нужны отладчику главного процесса.
      sourcemap: true,
    },
    // LARD: electron-log не бандлим. Он сам определяет тип процесса и
    // подгружает свои части через require, а после сборки эта логика ломается.
    // В рантайме модуль берётся из node_modules — electron-forge их упаковывает.
    external: ["electron", "electron-log", "electron-log/main"],
    plugins: [
      json(),
      nodeResolve({ preferBuiltins: true }),
      commonjs(),
      typescript(),
    ],
  },
]
