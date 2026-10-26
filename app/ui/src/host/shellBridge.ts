// Канал связи интерфейса с оболочкой MiliPlain (C#) через WebView2.
//
// Интерфейс не умеет сам работать с файлами и окнами — он просит оболочку.
// Просьба (request) — это сообщение {kind: "request", id, method, params}.
// Оболочка отвечает {kind: "response", id, ok, result | error} с тем же id,
// по нему ответ находит свою просьбу. Ещё оболочка может прислать событие
// {kind: "event", name, payload} — например, «пользователь закрывает окно».

/** То, что WebView2 даёт странице: window.chrome.webview. */
export interface WebViewChannel {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
}

declare global {
  interface Window {
    chrome?: { webview?: WebViewChannel };
  }
}

/** Канал WebView2 или null, если страница открыта в обычном браузере. */
export function findWebViewChannel(): WebViewChannel | null {
  return window.chrome?.webview ?? null;
}

interface PendingRequest {
  resolve(result: unknown): void;
  reject(error: Error): void;
}

type EventHandler = (payload: unknown) => void;

export class ShellBridge {
  private nextId = 1;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly eventHandlers = new Map<string, EventHandler[]>();

  constructor(private readonly channel: WebViewChannel) {
    channel.addEventListener("message", (event) => this.receive(event.data));
  }

  /** Попросить оболочку что-то сделать. Ошибка оболочки превращается в исключение. */
  request<T>(method: string, params: object = {}): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: (result) => resolve(result as T), reject });
      this.channel.postMessage({ kind: "request", id, method, params });
    });
  }

  /** Подписаться на событие от оболочки. */
  on(eventName: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventName) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(eventName, handlers);
  }

  private receive(data: unknown): void {
    if (typeof data !== "object" || data === null) return;
    const message = data as Record<string, unknown>;
    if (message.kind === "response" && typeof message.id === "number") {
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if (message.ok === true) request.resolve(message.result);
      else request.reject(new Error(typeof message.error === "string" ? message.error : "Ошибка оболочки"));
    } else if (message.kind === "event" && typeof message.name === "string") {
      for (const handler of this.eventHandlers.get(message.name) ?? []) handler(message.payload);
    }
  }
}
