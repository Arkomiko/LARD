/**
 * Предупреждение перед переходом в разработчиковый режим.
 *
 * Переход односторонний, и об этом надо сказать до, а не после: правила
 * упрощённого режима перестают действовать, и восстанавливать тему из пары
 * параметров будет уже неоткуда.
 */
import styled from "@emotion/styled"
import { useEffect, useRef } from "react"
import { Button } from "../ui/controls"

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.45);
  z-index: 10;
`

const Card = styled.div`
  width: min(30rem, 100%);
  padding: 1.25rem;
  border-radius: var(--radius-corner);
  border: 1px solid var(--color-popup-border);
  background: var(--color-background);
  box-shadow: 0 1.5rem 3rem var(--color-shadow);
`

const Title = styled.h2`
  margin: 0 0 0.75rem;
  font-size: 0.9375rem;
`

const Text = styled.p`
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
`

const Warning = styled(Text)`
  padding: 0.5rem 0.625rem;
  border-left: 3px solid var(--color-yellow);
  border-radius: var(--radius-control);
  background: var(--color-background-secondary);
  color: var(--color-text);
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
`

export const DevModeDialog = ({
  onKeep,
  onReset,
  onCancel,
}: {
  onKeep: () => void
  onReset: () => void
  onCancel: () => void
}) => {
  const keepRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    keepRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel])

  return (
    <Overlay role="dialog" aria-modal="true" aria-label="Переход в режим Dev">
      <Card>
        <Title>Перейти в режим Dev-Designed?</Title>
        <Text>
          Применённые правила из режимов «Fast Designed» и «Advanced mode» будут
          сброшены на стандартные для редактора. Сохранить текущие настройки или
          создать новую тему с нуля?
        </Text>
        <Warning>
          Вернуться обратно в «Fast Designed» или «Advanced mode» будет
          невозможно. Для возврата потребуется создать новую тему.
        </Warning>
        <Actions>
          <Button type="button" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="button" onClick={onReset}>
            Начать с нуля
          </Button>
          <Button
            type="button"
            $variant="primary"
            ref={keepRef}
            onClick={onKeep}
          >
            Сохранить текущие
          </Button>
        </Actions>
      </Card>
    </Overlay>
  )
}
