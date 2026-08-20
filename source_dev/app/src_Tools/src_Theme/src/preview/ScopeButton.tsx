/**
 * Переключатель области, на которую ложатся правки темы.
 *
 * `Full` — тема применяется во всём редакторе: перекрашивается и панель
 * настроек, и всё остальное. `Prototyping` — только макет; редактор остаётся
 * в собственной теме, и правки видны как на образце.
 *
 * Значок про это и говорит: точка с полукругами вокруг — правка расходится от
 * макета на весь редактор, одна точка — дальше макета не идёт.
 */
import styled from "@emotion/styled"
import type { ThemeScope } from "../state/useThemeEditor"

const Button = styled.button`
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

const Icon = ({ scope }: { scope: ThemeScope }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
    {scope === "full" && (
      <>
        <path d="M6 9 A 7 7 0 0 1 18 9" />
        <path d="M15 6 A 7 7 0 0 1 15 18" />
        <path d="M18 15 A 7 7 0 0 1 6 15" />
        <path d="M9 18 A 7 7 0 0 1 9 6" />
      </>
    )}
  </svg>
)

export const ScopeButton = ({
  scope,
  onChange,
}: {
  scope: ThemeScope
  onChange: (scope: ThemeScope) => void
}) => {
  const next: ThemeScope = scope === "full" ? "prototype" : "full"

  return (
    <Button
      type="button"
      title={
        next === "full"
          ? "Full — применять тему ко всему редактору"
          : "Prototyping — применять тему только к макету"
      }
      onClick={() => onChange(next)}
    >
      <Icon scope={scope} />
      {scope === "full" ? "Full" : "Prototyping"}
    </Button>
  )
}
