namespace MiliPlain.Engine;

/// <summary>
/// Где программа хранит свои данные. На Windows это %APPDATA%\MiliPlain:
/// журнал (logs), резервные копии (autosave), настройки (settings.json).
/// На других системах .NET подставит свою папку для данных программ.
/// </summary>
public sealed class AppFolders
{
    public AppFolders(string root)
    {
        Root = root;
    }

    /// <summary>Папки для текущего пользователя компьютера.</summary>
    public static AppFolders ForCurrentUser() =>
        new(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "MiliPlain"));

    public string Root { get; }

    public string Logs => Path.Combine(Root, "logs");

    public string Autosave => Path.Combine(Root, "autosave");

    public string SettingsFile => Path.Combine(Root, "settings.json");
}
