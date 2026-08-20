/**
 * Перевод на русский.
 *
 * Пример неполного перевода: здесь покрыта основная часть интерфейса,
 * а всё остальное автоматически берётся из en.ts. Ничего регистрировать
 * не нужно — файл в этой папке уже является языком.
 */
import type en from "./en"

/** Подпись в списке языков. */
export const label = "Русский"

const translation: Partial<typeof en> = {
  // Основное
  "piano-roll": "Пианоролл",
  "arrangement-view": "Аранжировка",
  tempo: "Темп",
  "time-signature": "Размер такта",
  "add-time-signature": "Добавить размер такта",
  "remove-time-signature": "Удалить размер такта",

  // Меню
  file: "Файл",
  edit: "Правка",
  "new-song": "Создать",
  "open-song": "Открыть",
  "save-song": "Сохранить",
  "save-as": "Сохранить как",
  "song-created": "Проект создан",
  "song-saving": "Сохранение...",
  "song-saved": "Проект сохранён",
  "download-midi": "Скачать MIDI-файл",
  "import-midi": "Импорт MIDI",
  "export-midi": "Экспорт MIDI",
  "untitled-song": "Без названия",

  // Треки
  name: "Имя",
  rename: "Переименовать",
  track: "Трек",
  "add-track": "Добавить трек",
  "delete-track": "Удалить трек",
  "duplicate-track": "Дублировать трек",
  "track-name": "Имя трека",
  channel: "Канал",
  categories: "Категории",
  instruments: "Инструменты",
  "rhythm-track": "Ударный трек",
  "conductor-track": "Дирижёрский трек",

  // Кнопки и общие слова
  cancel: "Отмена",
  insert: "Вставить",
  ok: "ОК",
  reset: "Сбросить",
  close: "Закрыть",
  export: "Экспорт",
  triplet: "Триоль",
  dotted: "С точкой",

  // Транспорт
  "play-pause": "Воспроизведение / Пауза",
  stop: "Стоп",
  rewind: "Назад",
  "fast-forward": "Вперёд",
  "forward-rewind": "Назад / Вперёд",
  "start-stop-recording": "Начать / остановить запись",
  "next-previous-track": "Следующий / предыдущий трек",
  "solo-mute-ghost": "Соло, мьют или призрачный трек",
  "auto-scroll": "Автопрокрутка",

  // Инструменты
  "pencil-tool": "Карандаш",
  "paint-tool": "Кисть",
  "delete-tool": "Ластик",
  "selection-tool": "Выделение",
  quantize: "Квантизация",
  transpose: "Транспонирование",
  velocity: "Громкость ноты",
  volume: "Громкость",

  // Правка
  undo: "Отменить",
  redo: "Повторить",
  cut: "Вырезать",
  copy: "Копировать",
  paste: "Вставить",
  delete: "Удалить",
  "select-all": "Выделить всё",
  "copy-selection": "Копировать выделенное",
  "cut-selection": "Вырезать выделенное",
  "paste-selection": "Вставить в выделение",
  "delete-selection": "Удалить выделенное",

  // Список событий
  tick: "Тик",
  event: "Событие",
  duration: "Длительность",
  value: "Значение",

  // Настройки и справка
  settings: "Настройки",
  language: "Язык",
  workspace: "Рабочая область",
  help: "Справка",
  "open-help": "Открыть справку",
  "keyboard-shortcut": "Горячие клавиши",

  // Экспорт звука
  "export-audio": "Экспорт аудио",
  "exporting-audio": "Экспорт аудио...",
  "export-error-too-short": "Проект слишком короткий",

  // Подтверждения
  "confirm-new": "Изменения не сохранены. Вы уверены, что хотите продолжить?",
  "confirm-open": "Изменения не сохранены. Вы уверены, что хотите продолжить?",
  "save-changes": "Сохранить изменения в проекте?",
}

export default translation
