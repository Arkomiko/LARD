namespace MiliPlain.Engine;

/// <summary>
/// Настройки программы (не проекта): общие для всех проектов пользователя.
/// Имена полей в settings.json те же, что в интерфейсе (app/ui/src/host/hostApi.ts).
/// </summary>
public sealed record AppSettings(int UndoLimit, int AutosaveIntervalMinutes, int AutosaveKeepCount)
{
    /// <summary>По умолчанию: 100 шагов отмены, автосохранение раз в 5 минут, 5 копий (ТЗ, п. 6.9).</summary>
    public static AppSettings Default { get; } = new(100, 5, AutosaveStore.DefaultKeepCount);

    /// <summary>
    /// Значения за границами приводятся к допустимым: отмена 1…10000 шагов,
    /// автосохранение 0…120 минут (0 — выключено), копий 1…50.
    /// </summary>
    public AppSettings Normalized() => new(
        Math.Clamp(UndoLimit, 1, 10_000),
        Math.Clamp(AutosaveIntervalMinutes, 0, 120),
        Math.Clamp(AutosaveKeepCount, 1, 50));
}
