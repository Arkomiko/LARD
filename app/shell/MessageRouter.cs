using System.Text.Json;
using MiliPlain.Engine;

namespace MiliPlain.Shell;

/// <summary>
/// Разбирает просьбы интерфейса и отвечает на них. Формат описан
/// в app/ui/src/host/shellBridge.ts:
/// просьба  {kind: "request", id, method, params}
/// ответ    {kind: "response", id, ok: true, result} или {kind: "response", id, ok: false, error}
/// событие  {kind: "event", name, payload}
/// </summary>
internal sealed class MessageRouter(FileLog log, Action<string> postJson)
{
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly Dictionary<string, Func<JsonElement, object?>> methods = [];

    /// <summary>
    /// Зарегистрировать метод, который интерфейс может вызвать по имени.
    /// Методы выполняются в потоке окна: им можно показывать диалоги.
    /// </summary>
    public void Register(string name, Func<JsonElement, object?> method) => methods[name] = method;

    /// <summary>Обработать сообщение от страницы. Любая ошибка превращается в ответ с ошибкой, а не в падение окна.</summary>
    public void Handle(string messageJson)
    {
        long id = 0;
        try
        {
            using var document = JsonDocument.Parse(messageJson);
            var message = document.RootElement;
            if (message.GetProperty("kind").GetString() != "request") return;
            id = message.GetProperty("id").GetInt64();
            var name = message.GetProperty("method").GetString() ?? "";
            var parameters = message.TryGetProperty("params", out var value) ? value.Clone() : default;

            if (!methods.TryGetValue(name, out var method))
            {
                Reply(id, ok: false, error: $"Оболочка не знает метода «{name}»");
                return;
            }
            Reply(id, ok: true, result: method(parameters));
        }
        catch (ProjectFileException error)
        {
            // Понятная пользователю ошибка с файлом — передаём как есть.
            Reply(id, ok: false, error: error.Message);
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException)
        {
            log.Warning($"Ошибка ввода-вывода: {error.Message}");
            Reply(id, ok: false, error: error.Message);
        }
        catch (Exception error)
        {
            log.Error("Ошибка при обработке просьбы интерфейса", error);
            Reply(id, ok: false, error: $"Внутренняя ошибка оболочки: {error.Message}");
        }
    }

    public void SendEvent(string name, object? payload = null) =>
        postJson(JsonSerializer.Serialize(new { kind = "event", name, payload }, JsonOptions));

    private void Reply(long id, bool ok, object? result = null, string? error = null) =>
        postJson(ok
            ? JsonSerializer.Serialize(new { kind = "response", id, ok, result }, JsonOptions)
            : JsonSerializer.Serialize(new { kind = "response", id, ok, error }, JsonOptions));
}
