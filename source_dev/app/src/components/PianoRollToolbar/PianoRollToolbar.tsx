import styled from "@emotion/styled"
import { type FC, useCallback } from "react"
import { useTrackList } from "../../hooks/useTrackList"
import { PanelToggleButton } from "../../lard/PanelToggleButton"
import { usePatternList } from "../../lard/pattern/usePatternList"
import { AutoScrollButton } from "../Toolbar/AutoScrollButton"
import { QuantizeSelector } from "../Toolbar/QuantizeSelector/QuantizeSelector"
import { Toolbar } from "../Toolbar/Toolbar"
import { EventListButton } from "./EventListButton"
import { InstrumentButton } from "./InstrumentButton"
import { PanSlider } from "./PanSlider"
import { PianoRollToolSelector } from "./PianoRollToolSelector"
import { TrackNameInput } from "./TrackNameInput"
import { VolumeSlider } from "./VolumeSlider"

const Spacer = styled.div`
  width: 1rem;
`

const FlexibleSpacer = styled.div`
  flex-grow: 1;
`

export const PianoRollToolbar: FC = () => {
  // LARD: две боковые панели вместо одной, поэтому переключатели разнесены
  // по краям тулбара — каждый со своей стороны от пианоролла.
  const { isOpen: isPatternListOpen, setOpen: setPatternListOpen } =
    usePatternList()
  const { isOpen: isTrackListOpen, setOpen: setTrackListOpen } = useTrackList()

  const togglePatternList = useCallback(
    () => setPatternListOpen((prev) => !prev),
    [setPatternListOpen],
  )
  const toggleTrackList = useCallback(
    () => setTrackListOpen((prev) => !prev),
    [setTrackListOpen],
  )

  return (
    <Toolbar>
      <PanelToggleButton
        isOpen={isPatternListOpen}
        onToggle={togglePatternList}
        side="left"
        title="Список паттернов"
      />

      <TrackNameInput />

      <EventListButton />

      <Spacer />

      <InstrumentButton />

      <VolumeSlider />
      <PanSlider />

      <FlexibleSpacer />

      <PianoRollToolSelector />

      <QuantizeSelector />

      <AutoScrollButton />

      <PanelToggleButton
        isOpen={isTrackListOpen}
        onToggle={toggleTrackList}
        side="right"
        title="Стойка инструментов"
      />
    </Toolbar>
  )
}
