/**
 * Вкладка «Элементы»: интерфейс, разобранный на части.
 *
 * Здесь нет ни пианоролла, ни панелей — только то, из чего интерфейс сложен:
 * кнопки, поля, карточки, таблица, подписи. Рядом с каждой парой «текст на
 * фоне» показан контраст, чтобы не гадать, дотянула тема до нормы или нет.
 *
 * Это соседняя вкладка макета, а не другой способ применять тему: где тема
 * применяется — говорит `Full` / `Prototyping`, и на обе вкладки это влияет
 * одинаково.
 */
import { useTheme } from "@emotion/react"
import styled from "@emotion/styled"
import { contrastLevel, contrastRatio } from "@lard/core"

const Sheet = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  align-content: start;
  align-items: start;
  gap: 1rem;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 1.25rem;
  border-radius: var(--radius-corner);
  border: 1px solid var(--color-popup-border);
  background: var(--color-background);
  box-shadow: 0 1.5rem 3rem var(--color-shadow);
`

const Block = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 0.875rem;
  border-radius: var(--radius-corner);
  border: 1px solid var(--color-divider);
  background: var(--color-background-secondary);
`

const BlockTitle = styled.h3`
  margin: 0;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
`

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`

const Primary = styled.button`
  padding: 0.45rem 0.85rem;
  font: inherit;
  font-size: 0.75rem;
  color: var(--color-on-surface);
  background: var(--color-theme);
  border: 1px solid var(--color-theme);
  border-radius: var(--radius-control);
`

const Secondary = styled(Primary)`
  color: var(--color-text);
  background: transparent;
  border-color: var(--color-divider);
`

const Input = styled.div`
  flex: 1;
  min-width: 8rem;
  padding: 0.45rem 0.6rem;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  background: var(--color-background);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-control);
`

const Badge = styled.span`
  padding: 0.15rem 0.5rem;
  font-size: 0.6875rem;
  color: var(--color-text);
  background: var(--color-highlight);
  border-radius: 999px;
`

const Heading = styled.p`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
`

const Body = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
`

const Caption = styled.p`
  margin: 0;
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
`

const Table = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-control);
  overflow: hidden;
`

const TableRow = styled.div<{ $highlighted?: boolean }>`
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  background: ${({ $highlighted }) =>
    $highlighted ? "var(--color-highlight)" : "transparent"};

  & + & {
    border-top: 1px solid var(--color-divider);
  }
`

const Meter = styled.span<{ $level: string }>`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: ${({ $level }) =>
    $level === "fail" ? "var(--color-red)" : "var(--color-text-tertiary)"};
`

const StatusDot = styled.span<{ color: string }>`
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: ${({ color }) => color};
`

/** Контраст пары рядом с самой парой: цифра там, где её проверяют. */
const Contrast = ({
  foreground,
  background,
  what,
}: {
  foreground: string
  background: string
  what: string
}) => {
  const ratio = contrastRatio(foreground, background)
  const level = contrastLevel(foreground, background)

  return (
    <Meter $level={level}>
      {what}: {Math.round(ratio * 10) / 10}:1 · {level}
    </Meter>
  )
}

export const ElementsSheet = () => {
  const theme = useTheme()

  return (
    <Sheet>
      <Block>
        <BlockTitle>Кнопки</BlockTitle>
        <Row>
          <Primary type="button">Сохранить тему</Primary>
          <Secondary type="button">Отмена</Secondary>
          <Badge>Черновик</Badge>
        </Row>
        <Contrast
          foreground={theme.onSurfaceColor}
          background={theme.themeColor}
          what="надпись на кнопке"
        />
      </Block>

      <Block>
        <BlockTitle>Поля</BlockTitle>
        <Row>
          <Input>Название темы</Input>
        </Row>
        <Contrast
          foreground={theme.tertiaryTextColor}
          background={theme.backgroundColor}
          what="подсказка в поле"
        />
      </Block>

      <Block>
        <BlockTitle>Текст</BlockTitle>
        <Heading>Заголовок карточки</Heading>
        <Body>
          Основной текст: две-три строки, по которым видно, насколько спокойно
          читается тема на длинном куске, а не на одном слове.
        </Body>
        <Caption>Подпись под текстом</Caption>
        <Contrast
          foreground={theme.textColor}
          background={theme.secondaryBackgroundColor}
          what="основной текст"
        />
        <Contrast
          foreground={theme.secondaryTextColor}
          background={theme.secondaryBackgroundColor}
          what="второстепенный"
        />
      </Block>

      <Block>
        <BlockTitle>Таблица</BlockTitle>
        <Table>
          <TableRow>
            <span>Дорожка 1</span>
            <span>Piano</span>
          </TableRow>
          <TableRow $highlighted>
            <span>Дорожка 2</span>
            <span>Bass</span>
          </TableRow>
          <TableRow>
            <span>Дорожка 3</span>
            <span>Drums</span>
          </TableRow>
        </Table>
        <Caption>Выделенная строка — фоновый акцент палитры.</Caption>
      </Block>

      <Block>
        <BlockTitle>Состояния</BlockTitle>
        <Row>
          <StatusDot color={theme.greenColor} /> Успех
          <StatusDot color={theme.yellowColor} /> Внимание
          <StatusDot color={theme.redColor} /> Ошибка
          <StatusDot color={theme.recordColor} /> Запись
        </Row>
        <Caption>
          Служебные цвета не выводятся из палитры: их узнают по смыслу.
        </Caption>
      </Block>
    </Sheet>
  )
}
