// Окно резервных копий: список копий всех проектов, самые свежие сверху.

import { errorText } from "../app/projectActions";
import { strings } from "../app/strings";
import type { BackupEntry } from "../host/hostApi";
import { element } from "./dom";
import type { ViewContext } from "./viewContext";

export async function openBackupsDialog(context: ViewContext): Promise<void> {
  let backups: BackupEntry[];
  try {
    backups = await context.host.listBackups();
  } catch (error) {
    context.notify({ kind: "error", text: strings.backups.title, details: [errorText(error)] });
    return;
  }

  const text = strings.backups;
  const dialog = element("dialog", {}, element("h2", { textContent: text.title }));
  if (backups.length === 0) {
    dialog.append(element("p", { className: "muted-text", textContent: text.empty }));
  } else {
    dialog.append(
      element(
        "table",
        {},
        element(
          "thead",
          {},
          element("tr", {}, ...text.columns.map((column) => element("th", { textContent: column }))),
        ),
        element(
          "tbody",
          {},
          ...backups.map((backup) =>
            element(
              "tr",
              {},
              element("td", { textContent: backup.projectName }),
              element("td", { textContent: new Date(backup.savedAt).toLocaleString() }),
              element(
                "td",
                {},
                element("button", {
                  textContent: text.open,
                  onclick: () => {
                    dialog.close();
                    void context.actions.openBackup(backup);
                  },
                }),
              ),
            ),
          ),
        ),
      ),
    );
  }
  dialog.append(
    element(
      "div",
      { className: "buttons" },
      element("button", { textContent: text.close, onclick: () => dialog.close() }),
    ),
  );
  dialog.addEventListener("close", () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}
