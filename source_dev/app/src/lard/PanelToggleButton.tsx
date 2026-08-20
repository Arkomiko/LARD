import styled from "@emotion/styled"
import MenuLeftIcon from "mdi-react/MenuLeftIcon"
import MenuRightIcon from "mdi-react/MenuRightIcon"
import { FC } from "react"

const Button = styled.button`
  -webkit-appearance: none;
  border: none;
  outline: none;
  height: 2rem;
  background: none;
  color: inherit;
  cursor: pointer;

  &:hover {
    background: none;
    color: var(--color-text-secondary);
  }
`

export interface PanelToggleButtonProps {
  isOpen: boolean
  onToggle: () => void
  /** С какой стороны редактора живёт панель — от этого зависит поворот стрелки. */
  side: "left" | "right"
  title: string
}

/**
 * Кнопка свёртывания боковой панели.
 *
 * В LARD панелей две, слева и справа, поэтому направление стрелки задаётся
 * параметром: закрытая панель показывает стрелку вниз, открытая — в свою сторону.
 */
export const PanelToggleButton: FC<PanelToggleButtonProps> = ({
  isOpen,
  onToggle,
  side,
  title,
}) => {
  const Icon = side === "left" ? MenuLeftIcon : MenuRightIcon
  const closedRotation = side === "left" ? "-90deg" : "90deg"

  return (
    <Button
      tabIndex={-1}
      title={title}
      onMouseDown={(e) => {
        // preventDefault, иначе кнопка забирает фокус у редактора
        // и перестают работать горячие клавиши.
        e.preventDefault()
        onToggle()
      }}
    >
      <Icon
        style={{
          transition: "transform 0.1s ease",
          transform: `scale(1.4) rotateZ(${isOpen ? "0deg" : closedRotation})`,
        }}
      />
    </Button>
  )
}
