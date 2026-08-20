import styled from "@emotion/styled"
import PlusIcon from "mdi-react/PlusIcon"
import { FC } from "react"
import { PatternListItem } from "./PatternListItem"
import { usePatternList } from "./usePatternList"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  border-right: 1px solid var(--color-divider);
  min-width: 11rem;
  flex-grow: 1;
  overflow: hidden;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-divider);
`

const Title = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
`

const AddButton = styled.button`
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
    background: var(--color-highlight);
    color: var(--color-text);
  }
`

const List = styled.div`
  overflow-y: auto;
  flex-grow: 1;
  padding-bottom: 0.5rem;
`

/**
 * Список паттернов — левая панель редактора, как в FL Studio.
 *
 * Клик выбирает паттерн, двойной клик переименовывает.
 * Ноты выбранного паттерна попадают в пианоролл справа.
 */
export const PatternList: FC = () => {
  const { patterns, addPattern } = usePatternList()

  return (
    <Container>
      <Header>
        <Title>Patterns</Title>
        <AddButton onClick={addPattern} title="Новый паттерн">
          <PlusIcon style={{ width: "1.1rem", height: "1.1rem" }} />
        </AddButton>
      </Header>
      <List>
        {patterns.map((pattern) => (
          <PatternListItem key={pattern.id} patternId={pattern.id} />
        ))}
      </List>
    </Container>
  )
}
