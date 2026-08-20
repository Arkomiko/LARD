import { ThemeProvider as EmotionThemeProvider } from "@emotion/react"
import { useMemo } from "react"
import { useSettings } from "../hooks/useSettings"
import { getTheme } from "./Theme"

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { themeType } = useSettings()

  // Объект темы должен быть стабильным по ссылке: на нём завязаны useMemo
  // в отрисовке сетки и нот, и новый объект на каждый рендер сбрасывал бы
  // их кэш, пересчитывая цвета WebGL без всякой причины.
  const theme = useMemo(() => getTheme(themeType), [themeType])

  return <EmotionThemeProvider theme={theme}>{children}</EmotionThemeProvider>
}
