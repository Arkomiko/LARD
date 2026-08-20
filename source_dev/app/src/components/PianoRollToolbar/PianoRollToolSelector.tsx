import styled from "@emotion/styled"
import BrushIcon from "mdi-react/BrushIcon"
import EraserIcon from "mdi-react/EraserIcon"
import { FC, ReactNode, useCallback } from "react"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import PencilIcon from "../../images/icons/pencil.svg"
import SelectionIcon from "../../images/icons/selection.svg"
import { PianoRollTool } from "../../lard/tools/PianoRollTool"
import { LocalizationKey, Localized } from "../../localize/useLocalization"
import {
  ToolbarButtonGroup,
  ToolbarButtonGroupItem,
} from "../Toolbar/ToolbarButtonGroup"
import { Tooltip } from "../ui/Tooltip"

const ButtonGroup = styled(ToolbarButtonGroup)`
  background-color: transparent;
  margin-right: 1rem;
`

const IconWrapper = styled.div`
  display: flex;
`

const iconStyle = {
  width: "1.3rem",
  height: "1.3rem",
  fill: "currentColor",
}

/**
 * Набор инструментов и буквы — как в FL Studio, чтобы не переучиваться.
 * Порядок тот же, что в тулбаре FL: рисование, кисть, ластик, выделение.
 */
const tools: {
  tool: PianoRollTool
  shortcut: string
  label: LocalizationKey
  icon: ReactNode
}[] = [
  {
    tool: "pencil",
    shortcut: "P",
    label: "pencil-tool",
    icon: <PencilIcon style={iconStyle} viewBox="0 0 128 128" />,
  },
  {
    tool: "paint",
    shortcut: "B",
    label: "paint-tool",
    icon: <BrushIcon size="1.3rem" />,
  },
  {
    tool: "delete",
    shortcut: "D",
    label: "delete-tool",
    icon: <EraserIcon size="1.3rem" />,
  },
  {
    tool: "selection",
    shortcut: "E",
    label: "selection-tool",
    icon: <SelectionIcon style={iconStyle} viewBox="0 0 128 128" />,
  },
]

const ToolButton: FC<{
  tool: PianoRollTool
  shortcut: string
  label: LocalizationKey
  icon: ReactNode
  selected: boolean
  onSelect: (tool: PianoRollTool) => void
}> = ({ tool, shortcut, label, icon, selected, onSelect }) => (
  <ToolbarButtonGroupItem
    onMouseDown={useCallback(() => onSelect(tool), [onSelect, tool])}
    selected={selected}
  >
    <Tooltip
      title={
        <>
          <Localized name={label} /> [{shortcut}]
        </>
      }
    >
      <IconWrapper>{icon}</IconWrapper>
    </Tooltip>
  </ToolbarButtonGroupItem>
)

export const PianoRollToolSelector = () => {
  const { mouseMode, setMouseMode } = usePianoRoll()

  return (
    <ButtonGroup>
      {tools.map((item) => (
        <ToolButton
          key={item.tool}
          {...item}
          selected={mouseMode === item.tool}
          onSelect={setMouseMode}
        />
      ))}
    </ButtonGroup>
  )
}
