// Точка входа интерфейса: связывает хранилище, оболочку, автосохранение,
// пианоролл, команды и экран.

import "../view/styles.css";
import { AutosaveScheduler } from "../files/autosaveScheduler";
import { type AppSettings, createOfflineHostApi, createShellHostApi, type HostApi } from "../host/hostApi";
import { findWebViewChannel } from "../host/shellBridge";
import { createProject } from "../model/create";
import { NoteClipboard } from "../pianoRoll/noteCommands";
import { createPianoRollPanel } from "../pianoRoll/pianoRollPanel";
import { ProjectStore } from "../state/projectStore";
import { mountAppView } from "../view/appView";
import { createNoticeArea } from "../view/notices";
import { createCommands } from "./commands";
import { bindHotkeys } from "./hotkeys";
import { DEFAULT_KEYMAP } from "./keymap";
import { errorText, ProjectActions } from "./projectActions";
import { strings } from "./strings";

async function start(): Promise<void> {
  // В окне MiliPlain есть канал WebView2; в обычном браузере — работаем без файлов.
  const channel = findWebViewChannel();
  const host = channel ? createShellHostApi(channel) : createOfflineHostApi();
  const [appInfo, loadedSettings] = await Promise.all([host.getAppInfo(), host.loadSettings()]);
  let settings: AppSettings = loadedSettings;

  const notices = createNoticeArea();
  const store = new ProjectStore(
    createProject({
      project: strings.newProjectName,
      channel: strings.channelName(1),
      pattern: strings.patternName(1),
    }),
    { undoLimit: settings.undoLimit },
  );

  const autosave = new AutosaveScheduler({
    currentProject: () => store.project,
    writeBackup: (project) => actions.writeBackup(project),
    reportError: (error) =>
      notices.show({ kind: "error", text: strings.backupFailed, details: [errorText(error)] }),
  });
  const actions = new ProjectActions({
    store,
    host,
    autosave,
    appVersion: appInfo.version,
    notify: notices.show,
  });
  autosave.markBackedUp(store.project);
  autosave.start(settings.autosaveIntervalMinutes);

  const pianoRoll = createPianoRollPanel(store);
  const commands = createCommands({
    store,
    actions,
    clipboard: new NoteClipboard(),
    pianoRoll: pianoRoll.controls,
  });
  bindHotkeys(window, DEFAULT_KEYMAP, commands);
  host.onCloseRequested(() => void actions.handleCloseRequest());
  keepWindowStateInSync(store, host);

  const root = document.getElementById("app");
  if (!root) throw new Error("В index.html нет элемента #app");
  mountAppView(
    root,
    {
      store,
      actions,
      host,
      appInfo,
      getSettings: () => settings,
      applySettings: async (requested) => {
        settings = await host.saveSettings(requested);
        store.setUndoLimit(settings.undoLimit);
        autosave.start(settings.autosaveIntervalMinutes);
      },
      notify: notices.show,
    },
    pianoRoll.element,
    notices.element,
  );

  // Инструменты замера скорости — только в режиме разработки (npm run dev);
  // в собранную программу этот код не попадает.
  if (import.meta.env.DEV) {
    const { installDeveloperTools } = await import("../pianoRoll/developerTools");
    installDeveloperTools(store, pianoRoll.canvas);
  }
}

/** Заголовок окна «• Имя проекта — MiliPlain» и отметка о несохранённом для оболочки. */
function keepWindowStateInSync(store: ProjectStore, host: HostApi): void {
  let lastSent = "";
  const sync = () => {
    const title = `${store.isDirty ? `${strings.unsavedMark} ` : ""}${store.project.name} — ${strings.appName}`;
    const state = `${title}|${store.isDirty}`;
    if (state === lastSent) return;
    lastSent = state;
    void host.setWindowState(title, store.isDirty);
  };
  store.subscribe(sync);
  sync();
}

start().catch((error: unknown) => {
  document.body.textContent = `Интерфейс не запустился: ${errorText(error)}`;
});
