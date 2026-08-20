/**
 * Тема emotion в редакторе — это тема LARD.
 *
 * Благодаря этому `useTheme()` и функции в стилях получают те же поля, что
 * лежат в файле темы, и опечатка в имени цвета видна на этапе проверки типов.
 */
import type { Theme as LardTheme } from "@lard/core"

declare module "@emotion/react" {
  export interface Theme extends LardTheme {}
}
