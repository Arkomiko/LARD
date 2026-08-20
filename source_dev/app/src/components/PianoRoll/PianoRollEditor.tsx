import styled from "@emotion/styled"
import { SplitPaneProps } from "@ryohey/react-split-pane"
import { FC, ReactNode } from "react"
import { useAutoFocus } from "../../hooks/useAutoFocus"
import { PianoRollScope } from "../../hooks/usePianoRoll"
import { usePianoRollKeyboardShortcut } from "../../hooks/usePianoRollKeyboardShortcut"
import { PatternList } from "../../lard/pattern/PatternList"
import { usePanel } from "../../workspace/useWorkspace"
import EventList from "../EventEditor/EventList"
import { PianoRollToolbar } from "../PianoRollToolbar/PianoRollToolbar"
import { TrackList } from "../TrackList/TrackList"
import { PianoRollTransposeDialog } from "../TransposeDialog/PianoRollTransposeDialog"
import { PianoRollVelocityDialog } from "../VelocityDialog/PianoRollVelocityDialog"
import PianoRoll from "./PianoRoll"
import { StyledSplitPane } from "./StyledSplitPane"

const ColumnContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  outline: none;
`

const PaneLayout: FC<SplitPaneProps & { isShow: boolean; pane: ReactNode }> = ({
  isShow,
  pane,
  children,
  ...props
}) => {
  if (isShow) {
    return (
      <StyledSplitPane {...props}>
        {pane}
        {children}
      </StyledSplitPane>
    )
  }
  return <>{children}</>
}

/**
 * То же, что PaneLayout, но панель ставится справа от содержимого.
 * primary="second" закрепляет размер за правой панелью, иначе при изменении
 * размера окна она бы растягивалась вместо пианоролла.
 */
const PaneLayoutRight: FC<
  SplitPaneProps & { isShow: boolean; pane: ReactNode }
> = ({ isShow, pane, children, ...props }) => {
  if (isShow) {
    return (
      <StyledSplitPane primary="second" {...props}>
        {children}
        {pane}
      </StyledSplitPane>
    )
  }
  return <>{children}</>
}

const PianoRollPanes: FC = () => {
  // Что видно и какой ширины — берётся из рабочей области, а перетаскивание
  // разделителя пишется обратно в неё же. Поэтому размер задан через `size`,
  // а не `defaultSize`: иначе выбранная раскладка применилась бы только при
  // первой отрисовке и смена её в настройках ничего бы не двигала.
  const patternList = usePanel("patternList")
  const trackList = usePanel("trackList")
  const eventList = usePanel("eventList")

  // LARD: раскладка как в FL Studio — паттерны слева, стойка инструментов
  // справа, пианоролл между ними.
  return (
    <div style={{ display: "flex", flexGrow: 1, position: "relative" }}>
      <PaneLayout
        split="vertical"
        minSize={140}
        size={patternList.size}
        onChange={patternList.setSize}
        // Отрицательный maxSize у этого сплиттера означает «оставь остальным
        // не меньше 480px». Так перетаскиванием нельзя задавить пианоролл.
        maxSize={-480}
        pane1Style={{ display: "flex" }}
        pane2Style={{ display: "flex" }}
        isShow={patternList.isOpen}
        pane={<PatternList />}
      >
        <PaneLayoutRight
          split="vertical"
          minSize={200}
          size={trackList.size}
          onChange={trackList.setSize}
          maxSize={-320}
          pane1Style={{ display: "flex" }}
          pane2Style={{ display: "flex" }}
          isShow={trackList.isOpen}
          pane={<TrackList />}
        >
          <PaneLayout
            split="vertical"
            minSize={240}
            size={eventList.size}
            onChange={eventList.setSize}
            pane1Style={{ display: "flex" }}
            pane2Style={{ display: "flex" }}
            isShow={eventList.isOpen}
            pane={<EventList />}
          >
            <PianoRoll />
          </PaneLayout>
        </PaneLayoutRight>
      </PaneLayout>
    </div>
  )
}

export const PianoRollEditor: FC = () => {
  const keyboardShortcutProps = usePianoRollKeyboardShortcut()
  const ref = useAutoFocus<HTMLDivElement>()
  // Тулбар прячется рабочей областью — как «Toolbars → Hide» в FL Studio.
  const toolbar = usePanel("toolbar")

  return (
    <PianoRollScope>
      <ColumnContainer {...keyboardShortcutProps} tabIndex={0} ref={ref}>
        {toolbar.isOpen && <PianoRollToolbar />}
        <PianoRollPanes />
      </ColumnContainer>
      <PianoRollTransposeDialog />
      <PianoRollVelocityDialog />
    </PianoRollScope>
  )
}
