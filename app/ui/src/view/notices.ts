// Уведомления в правом нижнем углу. Обычные исчезают сами через 5 секунд,
// ошибки висят, пока их не закроют: их нужно успеть прочитать.

import type { Notice } from "../app/projectActions";
import { element } from "./dom";

const INFO_LIFETIME_MS = 5000;

export function createNoticeArea(): { element: HTMLElement; show(notice: Notice): void } {
  const area = element("div", { className: "notices" });

  function show(notice: Notice): void {
    const item = element(
      "div",
      { className: notice.kind === "error" ? "notice error" : "notice", title: "Щелчок — закрыть" },
      element("div", { textContent: notice.text }),
      notice.details &&
        notice.details.length > 0 &&
        element("ul", {}, ...notice.details.map((detail) => element("li", { textContent: detail }))),
    );
    item.addEventListener("click", () => item.remove());
    area.append(item);
    if (notice.kind === "info") setTimeout(() => item.remove(), INFO_LIFETIME_MS);
  }

  return { element: area, show };
}
