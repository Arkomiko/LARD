/**
 * Редактор LARD в миниатюре.
 *
 * Это не скриншот и не сама программа, а её раскладка, собранная из тех же
 * цветов: панель инструментов, список паттернов, пианоролл, полоса
 * автоматизации, стойка инструментов, транспорт. Сетка и клавиши нарисованы
 * градиентами — так макет остаётся живым куском разметки, который
 * перекрашивается вместе с темой, без единой картинки.
 *
 * Панели здесь ровно те, что описывает формат рабочей области LARD, и ведут
 * себя так же: любую можно спрятать, боковые и полосу автоматизации — потянуть
 * за разделитель. Тема на широкой панели и на узкой выглядит по-разному, и
 * проверять это лучше на своей раскладке, а не на той, которую однажды выбрали
 * за всех. Карточки, кнопки и паттерны добавляются и убираются поштучно —
 * плюсы и крестики показываются под указателем, чтобы не мешать смотреть.
 *
 * Заголовка окна и полосы вкладок здесь нет намеренно: макет показывает
 * редактор, а не окно вокруг него.
 *
 * Всё оформление — переменные темы, ни одного значения из неё в разметке нет.
 * Поэтому подбор цвета этот компонент не перерисовывает: `memo` пропускает
 * перерисовку, а цвета меняются сами — через переменные на рамке макета.
 */
import styled from "@emotion/styled"
import { memo, type PointerEvent, useRef } from "react"
import type { Mockup, MockupPanelId, MockupPart } from "../state/useThemeEditor"

/**
 * Классы для показа кнопок под указателем.
 *
 * Именно классы, а не селекторы по компонентам: те требуют
 * `@emotion/babel-plugin`, которого в сборке редактора нет, — а стоил бы он
 * целого плагина ради двух правил.
 */
const ADD = "mockup-add"
const REMOVE = "mockup-remove"

const revealOnHover = `
  opacity: 0;
  transition: opacity 0.12s ease;

  &:focus-visible {
    opacity: 1;
  }
`

const Window = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius-corner);
  border: 1px solid var(--color-popup-border);
  background: var(--color-background);
  box-shadow: 0 1.5rem 3rem var(--color-shadow);
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid var(--color-divider);
  background: var(--color-background);

  &:hover .${ADD} {
    opacity: 1;
  }
`

const ToolButton = styled.div<{ $active?: boolean }>`
  position: relative;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: var(--radius-control);
  background: ${({ $active }) =>
    $active ? "var(--color-theme)" : "var(--color-background-secondary)"};
  border: 1px solid
    ${({ $active }) => ($active ? "var(--color-theme)" : "var(--color-divider)")};

  &:hover .${REMOVE} {
    opacity: 1;
  }
`

const TrackName = styled.div`
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  white-space: nowrap;
  color: var(--color-text);
  background: var(--color-background-secondary);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-control);
`

const Slider = styled.div`
  position: relative;
  width: 3.5rem;
  flex-shrink: 0;
  height: 2px;
  background: var(--color-divider);

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 60%;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: var(--color-theme);
  }
`

const Body = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
`

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--color-background);

  &:hover .${ADD} {
    opacity: 1;
  }
`

const PanelTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.5625rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
`

const Card = styled.div<{ $selected?: boolean }>`
  position: relative;
  flex-shrink: 0;
  padding: 0.4rem 0.5rem;
  font-size: 0.6875rem;
  border-radius: var(--radius-control);
  background: ${({ $selected }) =>
    $selected ? "var(--color-highlight)" : "var(--color-background-secondary)"};
  border: 1px solid
    ${({ $selected }) => ($selected ? "var(--color-theme)" : "var(--color-divider)")};

  &:hover .${REMOVE} {
    opacity: 1;
  }
`

const CardCaption = styled.div`
  font-size: 0.5625rem;
  color: var(--color-text-tertiary);
`

/** Список событий: две колонки моноширинным, как в настоящем редакторе. */
const EventRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  flex-shrink: 0;
  padding: 0.2rem 0.35rem;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-divider);
`

const Center = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`

const Ruler = styled.div`
  height: 1rem;
  flex-shrink: 0;
  background: var(--color-background-dark);
  border-bottom: 1px solid var(--color-divider);
  background-image: repeating-linear-gradient(
    to right,
    var(--color-editor-grid) 0 1px,
    transparent 1px 4rem
  );
`

const RollArea = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
`

/** Клавиатура слева: чередование белых и чёрных клавиш одним градиентом. */
const Keys = styled.div`
  width: 2.25rem;
  flex-shrink: 0;
  border-right: 1px solid var(--color-piano-lane-edge);
  background: repeating-linear-gradient(
    to bottom,
    var(--color-piano-key-white) 0 0.75rem,
    var(--color-piano-key-black) 0.75rem 1.25rem
  );
`

/** Полотно: дорожки клавиш, поверх них сетка долей и тактов. */
const Grid = styled.div`
  position: relative;
  flex: 1;
  background-color: var(--color-editor-background);
  background-image:
    repeating-linear-gradient(
      to right,
      var(--color-editor-grid) 0 1px,
      transparent 1px 4rem
    ),
    repeating-linear-gradient(
      to right,
      var(--color-editor-grid-secondary) 0 1px,
      transparent 1px 1rem
    ),
    repeating-linear-gradient(
      to bottom,
      var(--color-piano-lane-white) 0 0.75rem,
      var(--color-piano-lane-black) 0.75rem 1.25rem
    );
`

const Lane = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 0.75rem;
  background: var(--color-piano-lane-highlighted);
`

const Note = styled.div<{ $ghost?: boolean }>`
  position: absolute;
  height: 0.6rem;
  border-radius: 2px;
  background: ${({ $ghost }) =>
    $ghost ? "var(--color-ghost-note)" : "var(--color-theme)"};
`

const Playhead = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--color-cursor);
`

const ControlPane = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--color-editor-background);
`

const ControlTabs = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
  padding: 0.25rem 0.5rem;
  font-size: 0.625rem;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-divider);
`

const ControlTab = styled.span<{ $active?: boolean }>`
  color: ${({ $active }) =>
    $active ? "var(--color-text)" : "var(--color-text-secondary)"};
  border-bottom: 2px solid
    ${({ $active }) => ($active ? "var(--color-theme)" : "transparent")};
`

const Bars = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.25rem;
  flex: 1;
  min-height: 0;
  padding: 0.375rem 0.5rem;
`

const Bar = styled.div`
  width: 0.4rem;
  background: var(--color-theme);
  border-radius: 1px 1px 0 0;
`

const Transport = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  padding: 0.375rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
  background: var(--color-background-dark);
  border-top: 1px solid var(--color-divider);
`

const PlayButton = styled.div`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: var(--color-theme);
`

const RecordDot = styled.div`
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--color-record);
`

/**
 * Разделитель панелей. Тонкая полоса, за которую тянут, — ровно как в
 * настоящем редакторе; заодно на ней видно цвет разделителей темы.
 */
const Grip = styled.div<{ $horizontal?: boolean }>`
  flex-shrink: 0;
  background: var(--color-divider);
  ${({ $horizontal }) =>
    $horizontal
      ? `height: 3px; cursor: row-resize;`
      : `width: 3px; cursor: col-resize;`}

  &:hover,
  &:focus-visible {
    background: var(--color-theme);
  }
`

/**
 * Кнопка «убрать». Висит углом на самом элементе, а не рядом: так видно, что
 * именно исчезнет, и ряд не разъезжается от лишнего места между элементами.
 */
const Remove = styled.button`
  position: absolute;
  top: -0.3rem;
  right: -0.3rem;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.95rem;
  height: 0.95rem;
  padding: 0;
  font: inherit;
  font-size: 0.625rem;
  line-height: 1;
  color: var(--color-on-surface);
  background: var(--color-red);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  ${revealOnHover}

  &:hover {
    opacity: 1;
    filter: brightness(1.15);
  }
`

/** Кнопка «добавить» — пунктиром, чтобы её не путали с элементом макета. */
const Add = styled.button<{ $shape: "square" | "inline" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  font: inherit;
  line-height: 1;
  color: var(--color-text-secondary);
  background: none;
  border: 1px dashed var(--color-divider);
  cursor: pointer;
  ${revealOnHover}

  ${({ $shape }) =>
    $shape === "square"
      ? `width: 1.5rem; height: 1.5rem; font-size: 0.75rem;
         border-radius: var(--radius-control);`
      : `width: 1rem; height: 1rem; font-size: 0.625rem;
         border-radius: var(--radius-control);`}

  &:hover {
    opacity: 1;
    color: var(--color-theme);
    border-color: var(--color-theme);
  }
`

const notes = [
  { left: "6%", top: "18%", width: "12%" },
  { left: "22%", top: "30%", width: "8%" },
  { left: "34%", top: "24%", width: "16%" },
  { left: "54%", top: "42%", width: "10%" },
  { left: "68%", top: "12%", width: "14%" },
]

const bars = [40, 62, 30, 78, 55, 68, 44, 82, 36, 60, 72, 48]

const events = [
  ["0001:01", "Note C3"],
  ["0001:02", "Note E3"],
  ["0002:01", "Volume 100"],
  ["0002:03", "Note G3"],
  ["0003:01", "Pan 64"],
]

/**
 * Полоса, за которую тянут панель.
 *
 * Указатель захватывается на время перетаскивания: иначе стоит увести мышь с
 * трёхпиксельной полосы — и движение теряется. Стрелками работает так же:
 * разделитель попадает в обход с клавиатуры, а не остаётся только для мыши.
 */
const Divider = ({
  horizontal,
  label,
  onResize,
}: {
  horizontal?: boolean
  label: string
  onResize: (delta: number) => void
}) => {
  const last = useRef(0)

  const position = (event: PointerEvent<HTMLDivElement>) =>
    horizontal === true ? event.clientY : event.clientX

  return (
    <Grip
      $horizontal={horizontal}
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation={horizontal === true ? "horizontal" : "vertical"}
      onPointerDown={(event) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        last.current = position(event)
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
          return
        }
        const now = position(event)
        onResize(now - last.current)
        last.current = now
      }}
      onPointerUp={(event) =>
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      onKeyDown={(event) => {
        const back = horizontal === true ? "ArrowUp" : "ArrowLeft"
        const forth = horizontal === true ? "ArrowDown" : "ArrowRight"

        if (event.key === back || event.key === forth) {
          event.preventDefault()
          onResize(event.key === back ? -10 : 10)
        }
      }}
    />
  )
}

export interface WindowMockupProps {
  mockup: Mockup
  onAdd: (part: MockupPart) => void
  onRemove: (part: MockupPart, id: string) => void
  onResize: (id: MockupPanelId, by: number) => void
}

const WindowMockupView = ({
  mockup,
  onAdd,
  onRemove,
  onResize,
}: WindowMockupProps) => {
  const { panels } = mockup

  /**
   * Высота средней колонки: полоса автоматизации задана долей от неё, а
   * тянут её пикселями — пересчитывать не из чего, кроме живого размера.
   */
  const center = useRef<HTMLDivElement>(null)

  const remove = (part: MockupPart, id: string, what: string) => (
    <Remove
      type="button"
      className={REMOVE}
      title={`Убрать ${what}`}
      aria-label={`Убрать ${what}`}
      onClick={() => onRemove(part, id)}
    >
      ×
    </Remove>
  )

  const add = (part: MockupPart, shape: "square" | "inline", what: string) => (
    <Add
      type="button"
      className={ADD}
      $shape={shape}
      title={`Добавить ${what}`}
      aria-label={`Добавить ${what}`}
      onClick={() => onAdd(part)}
    >
      +
    </Add>
  )

  return (
    <Window>
      {panels.toolbar.visible && (
        <Toolbar>
          <TrackName>Трек 1</TrackName>
          {mockup.tools.map((item, index) => (
            <ToolButton key={item.id} $active={index === 0}>
              {remove("tools", item.id, "кнопку")}
            </ToolButton>
          ))}
          {add("tools", "square", "кнопку")}
          <Slider />
          <Slider />
        </Toolbar>
      )}

      <Body>
        {panels.patternList.visible && (
          <>
            <SidePanel style={{ width: panels.patternList.size }}>
              <PanelTitle>
                Паттерны
                {add("patterns", "inline", "паттерн")}
              </PanelTitle>
              {mockup.patterns.map((item, index) => (
                <Card key={item.id} $selected={index === 0}>
                  {item.title}
                  <CardCaption>{item.caption}</CardCaption>
                  {remove("patterns", item.id, "паттерн")}
                </Card>
              ))}
            </SidePanel>
            <Divider
              label="Ширина списка паттернов"
              onResize={(delta) => onResize("patternList", delta)}
            />
          </>
        )}

        {panels.eventList.visible && (
          <>
            <SidePanel style={{ width: panels.eventList.size }}>
              <PanelTitle>События</PanelTitle>
              {events.map(([at, what]) => (
                <EventRow key={`${at}-${what}`}>
                  <span>{at}</span>
                  <span>{what}</span>
                </EventRow>
              ))}
            </SidePanel>
            <Divider
              label="Ширина списка событий"
              onResize={(delta) => onResize("eventList", delta)}
            />
          </>
        )}

        <Center ref={center}>
          <Ruler />
          <RollArea>
            <Keys />
            <Grid>
              <Lane style={{ top: "36%" }} />
              {notes.map((note) => (
                <Note key={note.left} style={note} />
              ))}
              <Note $ghost style={{ left: "44%", top: "56%", width: "9%" }} />
              <Playhead style={{ left: "38%" }} />
            </Grid>
          </RollArea>

          {panels.controlPane.visible && (
            <>
              <Divider
                horizontal
                label="Высота полосы автоматизации"
                onResize={(delta) => {
                  const height = center.current?.clientHeight ?? 0
                  if (height > 0) {
                    // Вниз тянем — полоса ниже, поэтому знак обратный.
                    onResize("controlPane", (-delta / height) * 100)
                  }
                }}
              />
              <ControlPane style={{ height: `${panels.controlPane.size}%` }}>
                <ControlTabs>
                  <ControlTab $active>Громкость ноты</ControlTab>
                  <ControlTab>Pitch Bend</ControlTab>
                  <ControlTab>Panpot</ControlTab>
                </ControlTabs>
                <Bars>
                  {bars.map((height, index) => (
                    <Bar
                      // Столбики различаются только высотой, поэтому ключ — место.
                      key={`bar-${index}-${height}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </Bars>
              </ControlPane>
            </>
          )}
        </Center>

        {panels.trackList.visible && (
          <>
            <Divider
              label="Ширина стойки инструментов"
              onResize={(delta) => onResize("trackList", -delta)}
            />
            <SidePanel style={{ width: panels.trackList.size }}>
              <PanelTitle>
                Стойка
                {add("instruments", "inline", "инструмент")}
              </PanelTitle>
              {mockup.instruments.map((item, index) => (
                <Card key={item.id} $selected={index === 0}>
                  {item.title}
                  <CardCaption>{item.caption}</CardCaption>
                  {remove("instruments", item.id, "инструмент")}
                </Card>
              ))}
            </SidePanel>
          </>
        )}
      </Body>

      {panels.transport.visible && (
        <Transport>
          <PlayButton />
          <RecordDot />
          <span>120.00</span>
          <span>0001:01:000</span>
        </Transport>
      )}
    </Window>
  )
}

export const WindowMockup = memo(WindowMockupView)
