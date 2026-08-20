import { useTheme } from "@emotion/react"
import { Rectangles } from "@ryohey/webgl-react"
import Color from "color"
import { FC, useMemo } from "react"
import { colorToVec4 } from "../../gl/color"

export const Cursor: FC<{ x: number; height: number; zIndex: number }> = ({
  x,
  height,
  zIndex,
}) => {
  const theme = useTheme()

  // Курсор воспроизведения раньше был жёстко красным мимо темы.
  // Разбор цвета — не бесплатная операция, а курсор перерисовывается
  // каждый кадр, поэтому считаем его только при смене темы.
  const color = useMemo(
    () => colorToVec4(Color(theme.cursorColor)),
    [theme.cursorColor],
  )

  const rects = useMemo(() => [{ x, y: 0, width: 1, height }], [x, height])

  return <Rectangles rects={rects} color={color} zIndex={zIndex} />
}
