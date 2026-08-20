import styled from "@emotion/styled"
import ContentCopyIcon from "mdi-react/ContentCopyIcon"
import DeleteIcon from "mdi-react/DeleteIcon"
import { FC, useCallback, useState } from "react"
import { noteCountLabel, PatternId } from "./Pattern"
import { useDragPatternToDaw } from "./useDragPatternToDaw"
import { usePatternList } from "./usePatternList"

/** Имя класса блока кнопок — Container ссылается на него в своих стилях. */
const CONTROLS_CLASS = "lard-pattern-controls"

const Container = styled.div`
  /*
   * Разрешаем перенос именно этому элементу.
   * В GlobalCSS всем div задано -webkit-user-drag: none, и с ним движок
   * не рождает событие dragstart вовсе — атрибут draggable остаётся
   * бесполезным, а паттерн не вытаскивается в Ableton.
   * Селектор по классу специфичнее селектора по тегу, поэтому побеждает.
   */
  -webkit-user-drag: element;

  position: relative;
  display: flex;
  align-items: center;
  padding: 0.4rem 0.5rem;
  margin: 0.25rem 0.5rem;
  border: 1px solid transparent;
  border-radius: var(--radius-corner);
  cursor: pointer;
  outline: none;

  &:hover {
    background: var(--color-highlight);
  }

  &[data-selected="true"] {
    background-color: var(--color-highlight);
    border-color: var(--color-divider);
  }

  /*
   * Кнопки показываем по наведению на всю строку.
   * Селектор задан именем класса, а не подстановкой styled-компонента:
   * подстановка требует @emotion/babel-plugin, которого в сборке нет,
   * и без него приложение падает в рантайме на первом же рендере.
   */
  &:hover .${CONTROLS_CLASS} {
    display: flex;
  }
`

const Body = styled.div`
  flex-grow: 1;
  min-width: 0;
`

const Name = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &[data-selected="true"] {
    color: var(--color-text);
  }
`

const NoteCount = styled.div`
  font-size: 0.75rem;
  color: var(--color-text-secondary);
`

const NameInput = styled.input`
  width: 100%;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
  background: var(--color-background);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-control);
  padding: 0.1rem 0.25rem;
  outline: none;
`

/** Кнопки появляются только при наведении, чтобы список не рябил. */
const Controls = styled.div`
  display: none;
  align-items: center;
  gap: 0.15rem;
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  border: none;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--color-background);
    color: var(--color-text);
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`

const iconStyle = { width: "1rem", height: "1rem" }

export interface PatternListItemProps {
  patternId: PatternId
}

export const PatternListItem: FC<PatternListItemProps> = ({ patternId }) => {
  const {
    patterns,
    selectedPatternId,
    selectPattern,
    duplicatePattern,
    removePattern,
    renamePattern,
    getNoteCount,
  } = usePatternList()
  const { canDrag, startDrag } = useDragPatternToDaw()
  const [isEditing, setEditing] = useState(false)

  const pattern = patterns.find((p) => p.id === patternId)
  const isSelected = patternId === selectedPatternId
  // Единственный паттерн удалять нельзя — редактору нужен активный.
  const canRemove = patterns.length > 1

  const onClick = useCallback(
    () => selectPattern(patternId),
    [selectPattern, patternId],
  )

  const onDoubleClick = useCallback(() => setEditing(true), [])

  const onRenameFinished = useCallback(
    (name: string) => {
      renamePattern(patternId, name)
      setEditing(false)
    },
    [renamePattern, patternId],
  )

  const onClickDuplicate = useCallback(
    (e: React.MouseEvent) => {
      // Иначе сработает выбор паттерна на родительском элементе.
      e.stopPropagation()
      duplicatePattern(patternId)
    },
    [duplicatePattern, patternId],
  )

  const onClickRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      removePattern(patternId)
    },
    [removePattern, patternId],
  )

  const onDragStart = useCallback(
    (e: React.DragEvent) => {
      // Отменяем штатный перенос HTML5: он умеет ходить только внутри страницы.
      // Дальше перенос ведёт главный процесс Electron, отдавая настоящий файл.
      e.preventDefault()
      startDrag(patternId)
    },
    [startDrag, patternId],
  )

  if (pattern === undefined) {
    return null
  }

  return (
    <Container
      data-selected={isSelected}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable={canDrag}
      onDragStart={canDrag ? onDragStart : undefined}
      title={
        canDrag ? "Перетащите в Ableton, чтобы получить MIDI-клип" : undefined
      }
    >
      <Body>
        {isEditing ? (
          <PatternNameInput
            initialName={pattern.name}
            onFinish={onRenameFinished}
          />
        ) : (
          <>
            <Name data-selected={isSelected}>{pattern.name}</Name>
            <NoteCount>{noteCountLabel(getNoteCount(patternId))}</NoteCount>
          </>
        )}
      </Body>
      <Controls className={CONTROLS_CLASS}>
        <IconButton onClick={onClickDuplicate} title="Дублировать">
          <ContentCopyIcon style={iconStyle} />
        </IconButton>
        <IconButton
          onClick={onClickRemove}
          disabled={!canRemove}
          title={canRemove ? "Удалить" : "Нельзя удалить последний паттерн"}
        >
          <DeleteIcon style={iconStyle} />
        </IconButton>
      </Controls>
    </Container>
  )
}

/**
 * Поле переименования. Вынесено отдельным компонентом, чтобы состояние ввода
 * создавалось заново при каждом открытии и не хранило прошлое значение.
 */
const PatternNameInput: FC<{
  initialName: string
  onFinish: (name: string) => void
}> = ({ initialName, onFinish }) => {
  const [value, setValue] = useState(initialName)

  return (
    <NameInput
      value={value}
      autoFocus
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onFinish(value)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        // Горячие клавиши редактора не должны ловить ввод имени.
        e.stopPropagation()
        if (e.key === "Enter") {
          onFinish(value)
        }
        if (e.key === "Escape") {
          onFinish(initialName)
        }
      }}
    />
  )
}
