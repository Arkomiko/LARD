import styled from "@emotion/styled"
import { FC, useCallback } from "react"
import { useSettings } from "../../hooks/useSettings"
import { languageLabels } from "../../localize/localization"
import {
  Language,
  Localized,
  useCurrentLanguage,
} from "../../localize/useLocalization"
import { ThemeType, themeLabels } from "../../theme/Theme"
import { useWorkspace } from "../../workspace/useWorkspace"
import { WorkspaceName, workspaceLabels } from "../../workspace/workspaces"
import { DialogContent, DialogTitle } from "../Dialog/Dialog"
import { Checkbox } from "../ui/Checkbox"
import { Label } from "../ui/Label"
import { Select } from "../ui/Select"

interface LanguageItem {
  label: string
  language: Language
}

/**
 * LARD: список строится из файлов папки src/localize/Language, а не задаётся
 * вручную — иначе новый язык пришлось бы дописывать ещё и сюда.
 * Английский первым как основной, остальные по алфавиту.
 */
const languageItems: LanguageItem[] = Object.entries(languageLabels)
  .map(([language, label]) => ({ language, label }))
  .sort((a, b) => {
    if (a.language === "en") return -1
    if (b.language === "en") return 1
    return a.label.localeCompare(b.label)
  })

const LanguageSelect: FC = () => {
  const { language, setLanguage } = useSettings()
  const currentLanguage = useCurrentLanguage()
  const items = languageItems
  return (
    <Label>
      <Localized name="language" />
      <Select
        value={language ?? currentLanguage}
        onChange={(e) => setLanguage(e.target.value as Language)}
        style={{ marginTop: "0.5rem" }}
      >
        {items.map((item) => (
          <option key={item.language} value={item.language}>
            {item.label}
          </option>
        ))}
      </Select>
    </Label>
  )
}

/**
 * LARD: список тем строится из файлов папки Theme в корне репозитория.
 * Подпись берётся из поля "label" самого файла, поэтому своя тема
 * появляется здесь сразу после того, как её положили в папку.
 */
const themeItems = Object.entries(themeLabels)
  .map(([theme, label]) => ({ theme, label }))
  .sort((a, b) => a.label.localeCompare(b.label))

const ThemeSelect: FC = () => {
  const { themeType, setThemeType } = useSettings()
  return (
    <Label>
      <Localized name="theme" />
      <Select
        value={themeType}
        onChange={(e) => setThemeType(e.target.value as ThemeType)}
        style={{ marginTop: "0.5rem" }}
      >
        {themeItems.map((item) => (
          <option key={item.theme} value={item.theme}>
            {item.label}
          </option>
        ))}
      </Select>
    </Label>
  )
}

/**
 * LARD: список раскладок строится из файлов папки Workspace в корне
 * репозитория — как и список тем. Своя раскладка появляется здесь сразу
 * после того, как её положили в папку.
 */
const workspaceItems = Object.entries(workspaceLabels)
  .map(([workspace, label]) => ({ workspace, label }))
  .sort((a, b) => a.label.localeCompare(b.label))

const WorkspaceSelect: FC = () => {
  const { name, select } = useWorkspace()
  return (
    <Label>
      <Localized name="workspace" />
      <Select
        value={name}
        onChange={(e) => select(e.target.value as WorkspaceName)}
        style={{ marginTop: "0.5rem" }}
      >
        {workspaceItems.map((item) => (
          <option key={item.workspace} value={item.workspace}>
            {item.label}
          </option>
        ))}
      </Select>
    </Label>
  )
}

const ShowNoteLabelCheckbox: FC = () => {
  const { showNoteLabels, setShowNoteLabels } = useSettings()
  const onCheckedChange = useCallback(
    (checked: boolean) => {
      setShowNoteLabels(checked)
    },
    [setShowNoteLabels],
  )

  return (
    <Checkbox
      checked={showNoteLabels}
      onCheckedChange={onCheckedChange}
      label={<Localized name="show-note-labels" />}
    />
  )
}

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const SectionTitle = styled.div`
  font-weight: bold;
  margin: 1rem 0;
`

const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
`

export const GeneralSettingsView: FC = () => {
  return (
    <>
      <DialogTitle>
        <Localized name="general" />
      </DialogTitle>
      <DialogContent>
        <Column>
          <LanguageSelect />
          <ThemeSelect />
          <WorkspaceSelect />
          <SectionContent>
            <SectionTitle>
              <Localized name="appearance" />
            </SectionTitle>
            <ShowNoteLabelCheckbox />
          </SectionContent>
        </Column>
      </DialogContent>
    </>
  )
}
