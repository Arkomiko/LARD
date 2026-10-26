using MiliPlain.Engine;

namespace MiliPlain.Shell;

/// <summary>
/// Части движка, которыми пользуется оболочка, — собраны в одном месте,
/// чтобы окно и методы получали их одним параметром.
/// </summary>
internal sealed class ShellServices(AppFolders folders, FileLog log)
{
    public AppFolders Folders { get; } = folders;
    public FileLog Log { get; } = log;
    public SettingsStore SettingsStore { get; } = new(folders.SettingsFile, log);
    public AutosaveStore Autosave { get; } = new(folders.Autosave);

    /// <summary>Текущие настройки. Обновляются, когда пользователь их меняет.</summary>
    public AppSettings Settings { get; set; } = AppSettings.Default;

    public void LoadSettings() => Settings = SettingsStore.Load();

    /// <summary>При запуске убрать копии проектов, нетронутых больше месяца.</summary>
    public void CleanUpOldBackups()
    {
        try
        {
            var deleted = Autosave.DeleteStale(DateTime.Now);
            if (deleted > 0) Log.Info($"Удалены старые резервные копии: {deleted} проект(ов)");
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException)
        {
            Log.Warning($"Не удалось убрать старые резервные копии: {error.Message}");
        }
    }
}
