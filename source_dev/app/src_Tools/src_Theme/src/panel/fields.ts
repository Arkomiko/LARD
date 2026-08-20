/**
 * Поля темы, разложенные по смыслу.
 *
 * Список один на оба ручных режима: расширенный показывает первые группы,
 * разработчиковый — все. Порядок групп — от того, что меняют чаще всего, к
 * тому, что трогают редко.
 */
import type { Theme } from "@lard/core"

export interface FieldGroup {
  title: string
  hint?: string
  fields: { field: keyof Theme; label: string }[]
}

/** Группы, доступные в расширенном режиме. */
export const colorGroups: FieldGroup[] = [
  {
    title: "Основной цвет",
    hint: "Кнопки, активные вкладки, переключатели.",
    fields: [
      { field: "themeColor", label: "Основной" },
      { field: "onSurfaceColor", label: "Надпись на основном" },
    ],
  },
  {
    title: "Фон",
    fields: [
      { field: "backgroundColor", label: "Окно" },
      { field: "secondaryBackgroundColor", label: "Карточки и поля" },
      { field: "darkBackgroundColor", label: "Панели и заголовки" },
      { field: "editorBackgroundColor", label: "Полотно редактора" },
    ],
  },
  {
    title: "Текст",
    hint: "Ахроматический по умолчанию: цветные надписи первыми теряют читаемость.",
    fields: [
      { field: "textColor", label: "Основной" },
      { field: "secondaryTextColor", label: "Второстепенный" },
      { field: "tertiaryTextColor", label: "Подписи" },
    ],
  },
  {
    title: "Линии",
    fields: [
      { field: "dividerColor", label: "Разделители" },
      { field: "popupBorderColor", label: "Рамка окошек" },
      { field: "editorGridColor", label: "Сетка тактов" },
      { field: "editorSecondaryGridColor", label: "Сетка долей" },
    ],
  },
  {
    title: "Форма",
    hint: "Скругления. Значение — как в CSS: 0.5rem, 8px, 0.",
    fields: [
      { field: "cornerRadius", label: "Карточки и окна" },
      { field: "controlCornerRadius", label: "Кнопки и поля" },
    ],
  },
]

/** Дополнительные группы, доступные только в разработчиковом режиме. */
export const advancedOnlyGroups: FieldGroup[] = [
  {
    title: "Служебные цвета",
    hint: "Смысл важнее палитры: зелёный — успех, красный — запись.",
    fields: [
      { field: "greenColor", label: "Зелёный" },
      { field: "redColor", label: "Красный" },
      { field: "yellowColor", label: "Жёлтый" },
      { field: "recordColor", label: "Запись" },
      { field: "cursorColor", label: "Курсор воспроизведения" },
    ],
  },
  {
    title: "Пианоролл",
    fields: [
      { field: "pianoKeyWhite", label: "Белые клавиши" },
      { field: "pianoKeyBlack", label: "Чёрные клавиши" },
      { field: "pianoWhiteKeyLaneColor", label: "Дорожка белой клавиши" },
      { field: "pianoBlackKeyLaneColor", label: "Дорожка чёрной клавиши" },
      { field: "pianoHighlightedLaneColor", label: "Дорожка в тональности" },
      { field: "pianoLaneEdgeColor", label: "Границы дорожек" },
      { field: "ghostNoteColor", label: "Ноты-призраки" },
      { field: "highlightColor", label: "Подсветка под курсором" },
      { field: "shadowColor", label: "Тень" },
    ],
  },
  {
    title: "Шрифты",
    hint: "Значение — как в CSS: список семейств через запятую.",
    fields: [
      { field: "font", label: "Основной" },
      { field: "monoFont", label: "Моноширинный" },
      { field: "canvasFont", label: "Подписи в пианоролле" },
    ],
  },
]

/** Поля, которые правятся не цветом, а обычным текстом. */
export const textFields: (keyof Theme)[] = [
  "font",
  "monoFont",
  "canvasFont",
  "cornerRadius",
  "controlCornerRadius",
  "shadowColor",
]
