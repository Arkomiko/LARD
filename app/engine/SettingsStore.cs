using System.Text.Json;

namespace MiliPlain.Engine;

/// <summary>
/// Чтение и запись settings.json. Испорченный или старый файл не мешает
/// запуску: чего не хватает или что не читается — берётся по умолчанию.
/// </summary>
public sealed class SettingsStore(string filePath, FileLog? log = null)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    public AppSettings Load()
    {
        if (!File.Exists(filePath)) return AppSettings.Default;
        try
        {
            var stored = JsonSerializer.Deserialize<StoredSettings>(File.ReadAllText(filePath), JsonOptions);
            var defaults = AppSettings.Default;
            return new AppSettings(
                stored?.UndoLimit ?? defaults.UndoLimit,
                stored?.AutosaveIntervalMinutes ?? defaults.AutosaveIntervalMinutes,
                stored?.AutosaveKeepCount ?? defaults.AutosaveKeepCount).Normalized();
        }
        catch (Exception error) when (error is JsonException or IOException or UnauthorizedAccessException)
        {
            log?.Warning($"Настройки не прочитаны, взяты по умолчанию: {error.Message}");
            return AppSettings.Default;
        }
    }

    /// <summary>Сохранить и вернуть то, что реально записано (после приведения к границам).</summary>
    public AppSettings Save(AppSettings settings)
    {
        var normalized = settings.Normalized();
        AtomicFile.WriteText(filePath, JsonSerializer.Serialize(normalized, JsonOptions));
        return normalized;
    }

    // Все поля необязательные: в старом файле может не быть новых настроек.
    private sealed record StoredSettings(int? UndoLimit, int? AutosaveIntervalMinutes, int? AutosaveKeepCount);
}
