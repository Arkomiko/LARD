/**
 * Круглая ручка — та самая крутилка из микшеров.
 *
 * Для поправок она удобнее ползунка: их несколько подряд, они однородные, и
 * важно не точное число, а куда и насколько увёл. В ряд ручки встают плотно,
 * а дуга вокруг каждой читается с одного взгляда.
 *
 * Ручка двусторонняя: ноль наверху, дуга рисуется от него — вправо, если
 * увели в плюс, влево, если в минус. Так видно не только значение, но и то,
 * что значение это — поправка к посчитанному, а не самостоятельная величина.
 *
 * Крутится перетаскиванием вверх и вниз (как во всех редакторах звука),
 * стрелками с клавиатуры и сбрасывается в ноль двойным щелчком.
 */
import styled from "@emotion/styled"
import { type PointerEvent, useRef } from "react"

/** Насколько градусов заведена дуга: от «без четверти семь» до «пол пятого». */
const SWEEP = 270

/** Сколько пикселей тянуть на весь ход ручки. */
const TRAVEL = 180

const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 3.5rem;
`

const Dial = styled.div`
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  cursor: ns-resize;
  touch-action: none;

  &:focus-visible {
    outline: 2px solid var(--color-theme);
    outline-offset: 2px;
    border-radius: 50%;
  }
`

const Cap = styled.div`
  position: absolute;
  inset: 0.375rem;
  border-radius: 50%;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-divider);
`

/** Риска, показывающая, куда повёрнута ручка. */
const Pointer = styled.div<{ $angle: number }>`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2px;
  height: 0.6rem;
  border-radius: 1px;
  background: var(--color-text);
  transform: translate(-50%, -100%) rotate(${({ $angle }) => $angle}deg);
  transform-origin: 50% 100%;
`

const Label = styled.span`
  font-size: 0.625rem;
  line-height: 1.2;
  text-align: center;
  color: var(--color-text-secondary);
`

const Value = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  color: var(--color-text-tertiary);
`

export interface KnobProps {
  label: string
  hint?: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

export const Knob = ({
  label,
  hint,
  value,
  min = -100,
  max = 100,
  onChange,
}: KnobProps) => {
  const dragged = useRef(0)

  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next)))

  /** Доля хода: 0 — крайнее левое, 1 — крайнее правое. */
  const fraction = (value - min) / (max - min)
  const zero = (0 - min) / (max - min)

  // Дуга рисуется от нуля до значения. `pathLength` нормирует длину окружности
  // в сотню, поэтому длины считаются долями, а не через радиус и число пи.
  const from = Math.min(zero, fraction)
  const length = Math.abs(fraction - zero)

  const change = (next: number) => {
    const rounded = clamp(next)
    if (rounded !== value) {
      onChange(rounded)
    }
  }

  return (
    <Root>
      <Dial
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value > 0 ? "+" : ""}${value}`}
        title={hint}
        onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          dragged.current = event.clientY
        }}
        onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
            return
          }
          // Вверх — больше: экранный ноль сверху, поэтому знак обратный.
          const delta = dragged.current - event.clientY
          dragged.current = event.clientY
          change(value + (delta / TRAVEL) * (max - min))
        }}
        onPointerUp={(event: PointerEvent<HTMLDivElement>) =>
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
        onDoubleClick={() => change(0)}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 1 : 5

          if (event.key === "ArrowUp" || event.key === "ArrowRight") {
            event.preventDefault()
            change(value + step)
          }
          if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
            event.preventDefault()
            change(value - step)
          }
          if (event.key === "Home") {
            event.preventDefault()
            change(0)
          }
        }}
      >
        <svg
          viewBox="0 0 40 40"
          width="100%"
          height="100%"
          // Начало окружности — справа; поворот уводит его в левый нижний угол,
          // откуда и должна начинаться шкала.
          style={{ transform: "rotate(135deg)" }}
          aria-hidden="true"
        >
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="var(--color-divider)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${SWEEP / 3.6} 100`}
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="var(--color-theme)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${(length * SWEEP) / 3.6} 100`}
            strokeDashoffset={`${(-from * SWEEP) / 3.6}`}
          />
        </svg>
        <Cap />
        <Pointer $angle={-SWEEP / 2 + fraction * SWEEP} />
      </Dial>

      <Label>{label}</Label>
      <Value>
        {value > 0 ? "+" : ""}
        {value}
      </Value>
    </Root>
  )
}
