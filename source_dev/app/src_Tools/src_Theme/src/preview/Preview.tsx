/**
 * Правая половина редактора: сцена с макетом.
 *
 * Сверху — вкладки: окно программы или интерфейс, разобранный на элементы.
 * Это про то, **что** показывают. Рядом — `Full` / `Prototyping`: это про то,
 * **где** применяется тема, во всём редакторе или только на макете. Раньше
 * одна кнопка делала и то и другое, и «Prototyping» означал совсем не то, что
 * должен был.
 *
 * Второй строкой — панели макета. Это тот же список, что в файле рабочей
 * области, и ведёт он себя так же: панель прячется и возвращается со своим
 * размером. Кнопка «Загрузить Workspace» со временем заменит эти щелчки одним
 * выбором готовой раскладки.
 *
 * Шапка — часть редактора, а не макета, поэтому она остаётся снаружи рамки: в
 * режиме `Prototyping` правимая тема до неё не достаёт, и переключатели видно
 * даже тогда, когда тема сделала макет нечитаемым.
 *
 * Окно лежит на «столе» — поверхности чуть глубже основного фона. Так видно
 * границы окна и его тень: тема отвечает и за них тоже.
 */
import styled from "@emotion/styled"
import { useRef } from "react"
import {
  mockupPanelIds,
  type PreviewTab,
  panelLabels,
  useThemeEditor,
} from "../state/useThemeEditor"
import { Segmented, Toast, useTransientMessage } from "../ui/controls"
import { useThemeVariables } from "../ui/themeVariables"
import { ElementsSheet } from "./ElementsSheet"
import { ScopeButton } from "./ScopeButton"
import { WindowMockup } from "./WindowMockup"

const Stage = styled.main`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  padding: 0.75rem 1.25rem 1.25rem;
  background: var(--color-editor-background);
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-bottom: 0.5rem;
`

const Tools = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const PanelBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
  padding-bottom: 0.75rem;
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
`

const PanelChip = styled.button<{ $on: boolean }>`
  padding: 0.25rem 0.5rem;
  font: inherit;
  font-size: 0.6875rem;
  border-radius: 999px;
  cursor: pointer;
  color: ${({ $on }) =>
    $on ? "var(--color-on-surface)" : "var(--color-text-secondary)"};
  background: ${({ $on }) => ($on ? "var(--color-theme)" : "transparent")};
  border: 1px solid
    ${({ $on }) => ($on ? "var(--color-theme)" : "var(--color-divider)")};

  &:hover {
    border-color: var(--color-theme);
  }
`

const PillButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.6rem;
  font: inherit;
  font-size: 0.6875rem;
  color: var(--color-text);
  background: var(--color-background-secondary);
  border: 1px solid var(--color-divider);
  border-radius: 999px;
  cursor: pointer;

  &:hover {
    border-color: var(--color-theme);
  }
`

/**
 * Рамка макета. Именно на ней живут переменные правимой темы — и в режиме
 * `Full`, и в `Prototyping`. Разница только в том, достались ли те же
 * переменные ещё и корню страницы; за это отвечает `EditorTheme`.
 *
 * Цвет текста и шрифт заданы здесь, а не оставлены на наследование от body:
 * переменная подставляется там, где ею пользуются, а `body` пользуется той,
 * что стоит на корне. В режиме `Prototyping` на корне тема редактора — и
 * подписи макета, которым цвет достался по наследству, оказывались светлыми
 * на светлом.
 */
const Frame = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  font-family: var(--font-sans);
  color: var(--color-text);
`

const tabs: { id: PreviewTab; title: string; hint: string }[] = [
  { id: "window", title: "Окно", hint: "Редактор LARD в миниатюре" },
  {
    id: "elements",
    title: "Элементы",
    hint: "Кнопки, поля, карточки и контраст рядом с каждой парой",
  },
]

export const Preview = () => {
  const {
    tab,
    scope,
    theme,
    mockup,
    setTab,
    setScope,
    addToMockup,
    removeFromMockup,
    togglePanel,
    resizePanel,
    resetMockup,
  } = useThemeEditor()

  const frame = useRef<HTMLDivElement>(null)
  useThemeVariables(frame, theme)

  const [notice, notify] = useTransientMessage()

  return (
    <Stage>
      <Header>
        <Segmented
          label="Что показано в макете"
          value={tab}
          options={tabs}
          onChange={setTab}
        />

        <Tools>
          {tab === "window" && (
            <>
              <PillButton
                type="button"
                title="Загрузить готовую раскладку из папки Workspace"
                onClick={() => notify("Скоро")}
              >
                Загрузить Workspace
              </PillButton>

              <PillButton
                type="button"
                title="Вернуть макет к раскладке LARD по умолчанию"
                onClick={resetMockup}
              >
                Сбросить макет
              </PillButton>
            </>
          )}

          <ScopeButton scope={scope} onChange={setScope} />
        </Tools>
      </Header>

      {tab === "window" && (
        <PanelBar>
          Панели:
          {mockupPanelIds.map((id) => (
            <PanelChip
              key={id}
              type="button"
              $on={mockup.panels[id].visible}
              aria-pressed={mockup.panels[id].visible}
              title={`Показать или спрятать: ${panelLabels[id].toLowerCase()}`}
              onClick={() => togglePanel(id)}
            >
              {panelLabels[id]}
            </PanelChip>
          ))}
        </PanelBar>
      )}

      <Frame ref={frame}>
        {tab === "window" ? (
          <WindowMockup
            mockup={mockup}
            onAdd={addToMockup}
            onRemove={removeFromMockup}
            onResize={resizePanel}
          />
        ) : (
          <ElementsSheet />
        )}
      </Frame>

      {notice !== null && <Toast>{notice}</Toast>}
    </Stage>
  )
}
