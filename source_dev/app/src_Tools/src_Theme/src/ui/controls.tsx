/**
 * Мелкие детали интерфейса редактора.
 *
 * Все цвета и скругления берутся переменными темы: редактор перекрашивается
 * вместе с тем, что в нём правят, и отдельного «своего» оформления у него нет.
 */
import styled from "@emotion/styled"
import type { ThemeIssue } from "@lard/core"
import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

export const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 0;

  & + & {
    border-top: 1px solid var(--color-divider);
  }
`

export const GroupTitle = styled.h2`
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
`

export const Hint = styled.p`
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--color-text-secondary);
`

const FieldRow = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-text);
`

const FieldName = styled.span`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
`

const FieldMeta = styled.span`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
`

/** Поле настройки: подпись, значение и замечания под ним. */
export const Field = ({
  label,
  meta,
  issues = [],
  children,
}: {
  label: ReactNode
  meta?: ReactNode
  issues?: ThemeIssue[]
  children: ReactNode
}) => (
  <FieldRow>
    <FieldName>
      <span>{label}</span>
      {meta !== undefined && <FieldMeta>{meta}</FieldMeta>}
    </FieldName>
    {children}
    {issues.map((issue) => (
      <Notice key={issue.message} $level={issue.level}>
        {issue.message}
      </Notice>
    ))}
  </FieldRow>
)

/**
 * Сообщение под изменённой настройкой — там, где его увидят: рядом с тем, что
 * его вызвало, а не общим списком где-то внизу.
 */
export const Notice = styled.p<{ $level: ThemeIssue["level"] }>`
  margin: 0;
  padding: 0.4rem 0.5rem;
  font-size: 0.6875rem;
  line-height: 1.4;
  border-radius: var(--radius-control);
  border-left: 3px solid
    ${({ $level }) =>
      $level === "error" ? "var(--color-red)" : "var(--color-yellow)"};
  background: var(--color-background-secondary);
  color: var(--color-text);
`

export const Select = styled.select`
  appearance: none;
  width: 100%;
  padding: 0.4rem 0.5rem;
  font: inherit;
  font-size: 0.75rem;
  color: var(--color-text);
  background: var(--color-background-secondary);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-control);
  cursor: pointer;
`

export const TextInput = styled.input`
  width: 100%;
  padding: 0.4rem 0.5rem;
  font: inherit;
  font-size: 0.75rem;
  color: var(--color-text);
  background: var(--color-background-secondary);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-control);
`

const ColorRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`

const ColorWell = styled.input`
  flex-shrink: 0;
  width: 2.25rem;
  height: 2rem;
  padding: 0;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-control);
  background: none;
  cursor: pointer;

  &::-webkit-color-swatch-wrapper {
    padding: 2px;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: calc(var(--radius-control) - 1px);
  }
`

const ColorText = styled(TextInput)`
  font-family: var(--font-mono);
`

/**
 * Сводит поток правок к одной на кадр.
 *
 * Пипетка шлёт событие на каждое движение мыши — за секунду их сотни, и на
 * каждом пересчитывалась тема и перерисовывалась панель. Экран всё равно
 * обновляется раз в кадр, поэтому чаще кадра считать нечего: берётся
 * последнее значение, остальные пропадают, не дойдя до состояния.
 *
 * Текстовое поле через это не пропускают: там одна правка на нажатие клавиши,
 * а задержка на кадр в управляемом поле умеет отбирать введённый символ.
 */
const useCoalesced = (onChange: (value: string) => void) => {
  const latest = useRef<string | null>(null)
  const frame = useRef(0)
  const handler = useRef(onChange)
  handler.current = onChange

  useEffect(
    () => () => {
      if (frame.current !== 0) {
        cancelAnimationFrame(frame.current)
      }
    },
    [],
  )

  return useCallback((value: string) => {
    latest.current = value

    if (frame.current !== 0) {
      return
    }

    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      if (latest.current !== null) {
        handler.current(latest.current)
      }
    })
  }, [])
}

/**
 * Выбор цвета: пипетка и поле для точного значения рядом.
 *
 * Пипетка понимает только `#rrggbb`, а в теме цвет может быть записан как
 * угодно — например `hsl(...)`. Поэтому в пипетку отдаётся приведённое
 * значение, а править текстом можно как есть.
 */
export const ColorField = ({
  value,
  swatch,
  onChange,
}: {
  value: string
  swatch: string
  onChange: (value: string) => void
}) => {
  const pick = useCoalesced(onChange)

  return (
    <ColorRow>
      <ColorWell
        type="color"
        value={swatch}
        onChange={(e: ChangeEvent<HTMLInputElement>) => pick(e.target.value)}
      />
      <ColorText
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        spellCheck={false}
      />
    </ColorRow>
  )
}

const SegmentedRow = styled.div`
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 0.125rem;
  padding: 0.125rem;
  border-radius: var(--radius-control);
  background: var(--color-background-secondary);
  border: 1px solid var(--color-divider);
`

const Segment = styled.button<{ $active: boolean }>`
  padding: 0.3rem 0.6rem;
  font: inherit;
  font-size: 0.6875rem;
  white-space: nowrap;
  border: none;
  border-radius: calc(var(--radius-control) - 1px);
  cursor: pointer;
  color: ${({ $active }) =>
    $active ? "var(--color-on-surface)" : "var(--color-text-secondary)"};
  background: ${({ $active }) => ($active ? "var(--color-theme)" : "transparent")};
`

/**
 * Выбор одного из нескольких — переключателем, а не списком.
 *
 * Годится там, где вариантов два-три и все они должны быть на виду: основа
 * темы, вкладка превью. Список прячет варианты под щелчок, а здесь важно
 * видеть, что выбор вообще есть.
 */
export const Segmented = <T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { id: T; title: ReactNode; hint?: string }[]
  onChange: (value: T) => void
  label: string
}) => (
  <SegmentedRow role="radiogroup" aria-label={label}>
    {options.map((option) => (
      <Segment
        key={option.id}
        type="button"
        role="radio"
        aria-checked={value === option.id}
        title={option.hint}
        $active={value === option.id}
        onClick={() => onChange(option.id)}
      >
        {option.title}
      </Segment>
    ))}
  </SegmentedRow>
)

const SwitchRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.75rem;
  cursor: pointer;
`

const SwitchTrack = styled.span<{ $on: boolean }>`
  flex-shrink: 0;
  position: relative;
  width: 2.25rem;
  height: 1.25rem;
  border-radius: 999px;
  transition: background 0.15s ease;
  background: ${({ $on }) =>
    $on ? "var(--color-theme)" : "var(--color-background-secondary)"};
  border: 1px solid
    ${({ $on }) => ($on ? "var(--color-theme)" : "var(--color-divider)")};

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: ${({ $on }) => ($on ? "calc(100% - 1.05rem)" : "0.125rem")};
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 50%;
    transform: translateY(-50%);
    transition: left 0.15s ease;
    background: ${({ $on }) =>
      $on ? "var(--color-on-surface)" : "var(--color-text-secondary)"};
  }
`

const HiddenCheckbox = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`

/** Переключатель «включено — выключено». */
export const Switch = ({
  label,
  checked,
  onChange,
}: {
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}) => (
  <SwitchRow>
    <span>{label}</span>
    <HiddenCheckbox
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <SwitchTrack $on={checked} />
  </SwitchRow>
)

export const Button = styled.button<{ $variant?: "primary" | "ghost" }>`
  padding: 0.45rem 0.8rem;
  font: inherit;
  font-size: 0.75rem;
  border-radius: var(--radius-control);
  cursor: pointer;
  transition: filter 0.15s ease;

  color: ${({ $variant }) =>
    $variant === "primary" ? "var(--color-on-surface)" : "var(--color-text)"};
  background: ${({ $variant }) =>
    $variant === "primary" ? "var(--color-theme)" : "transparent"};
  border: 1px solid
    ${({ $variant }) =>
      $variant === "primary" ? "var(--color-theme)" : "var(--color-divider)"};

  &:hover {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`

/**
 * Сообщение, которое само исчезает.
 *
 * Для ответов вроде «Скоро»: сказать надо, а закрывать это руками — лишнее
 * действие ради строчки текста.
 */
export const useTransientMessage = (timeout = 1800) => {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef(0)

  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
    },
    [],
  )

  const show = useCallback(
    (text: string) => {
      setMessage(text)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setMessage(null), timeout)
    },
    [timeout],
  )

  return [message, show] as const
}

/** Само сообщение — углом сцены, поверх содержимого. */
export const Toast = styled.div`
  position: absolute;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 2;
  padding: 0.5rem 0.85rem;
  font-size: 0.75rem;
  color: var(--color-on-surface);
  background: var(--color-theme);
  border-radius: 999px;
  box-shadow: 0 0.5rem 1.5rem var(--color-shadow);
`
