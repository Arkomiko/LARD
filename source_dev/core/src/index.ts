/**
 * Ядро LARD.
 *
 * Здесь лежит то, что нужно **и** основному приложению, **и** редакторам из
 * `source_dev/app/src_Tools`: формат пресетов и их загрузка. Каждый редактор правит
 * свой вид пресетов, но читают и понимают формат все одинаково — через это
 * ядро, а не через собственную копию логики.
 *
 * Ядро не знает ни про React, ни про Electron, ни про Vite: оно работает с
 * уже прочитанными файлами. Кто и как их прочитал — дело вызывающего.
 *
 * Не путать с `@signal-app/core` из `packages/core`: там музыкальная модель
 * (песня, дорожки, события), унаследованная от signal.
 */

export * from "./color/color"
export * from "./color/colorblind"
export * from "./language/Language"
export * from "./language/loadLanguages"
export * from "./language/localeRules"
export * from "./presets/presetFolder"
export * from "./theme/generator/checkTheme"
export * from "./theme/generator/generateTheme"
export * from "./theme/generator/harmony"
export * from "./theme/loadThemes"
export * from "./theme/Theme"
export * from "./workspace/loadWorkspaces"
export * from "./workspace/Workspace"
