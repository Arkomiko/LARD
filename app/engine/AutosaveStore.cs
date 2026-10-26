using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace MiliPlain.Engine;

/// <summary>Резервная копия проекта.</summary>
public sealed record BackupEntry(string Path, string ProjectId, string ProjectName, DateTime SavedAt);

/// <summary>
/// Резервные копии (автосохранение). Устройство папки:
/// <code>
/// autosave\
///   &lt;номер проекта&gt;\
///     info.json                     ← имя проекта для списка копий
///     2026-10-25_16-30-00-000.mpj   ← копии, имя — время записи
/// </code>
/// Для каждого проекта хранится несколько последних копий. Папки проектов,
/// которые месяц не менялись, удаляются при запуске программы.
/// </summary>
public sealed partial class AutosaveStore(string folder)
{
    public const int DefaultKeepCount = 5;
    public static readonly TimeSpan StaleAfter = TimeSpan.FromDays(30);

    private const string InfoFileName = "info.json";
    private const string TimeFormat = "yyyy-MM-dd_HH-mm-ss-fff";

    /// <summary>Записать копию и удалить лишние старые. Возвращает путь к новой копии.</summary>
    public string Write(string projectId, string projectName, string projectJson, int keepCount, DateTime now)
    {
        var projectFolder = Path.Combine(folder, CheckProjectId(projectId));
        var path = Path.Combine(projectFolder, now.ToString(TimeFormat, CultureInfo.InvariantCulture) + ProjectArchive.FileExtension);
        ProjectArchive.Write(path, projectJson);
        AtomicFile.WriteText(Path.Combine(projectFolder, InfoFileName), JsonSerializer.Serialize(new BackupInfo(projectName)));
        DeleteOldest(projectFolder, Math.Max(1, keepCount));
        return path;
    }

    /// <summary>Все копии всех проектов, сначала самые свежие.</summary>
    public IReadOnlyList<BackupEntry> List()
    {
        if (!Directory.Exists(folder)) return [];
        var entries = new List<BackupEntry>();
        foreach (var projectFolder in Directory.GetDirectories(folder))
        {
            var projectId = Path.GetFileName(projectFolder);
            var projectName = ReadProjectName(projectFolder) ?? projectId;
            foreach (var path in BackupFiles(projectFolder))
                entries.Add(new BackupEntry(path, projectId, projectName, SavedAt(path)));
        }
        return entries.OrderByDescending(entry => entry.SavedAt).ToList();
    }

    /// <summary>Удалить копии проектов, к которым не прикасались дольше месяца. Возвращает, сколько папок удалено.</summary>
    public int DeleteStale(DateTime now)
    {
        if (!Directory.Exists(folder)) return 0;
        var deleted = 0;
        foreach (var projectFolder in Directory.GetDirectories(folder))
        {
            var newest = BackupFiles(projectFolder).Select(SavedAt).DefaultIfEmpty(DateTime.MinValue).Max();
            if (now - newest <= StaleAfter) continue;
            Directory.Delete(projectFolder, recursive: true);
            deleted++;
        }
        return deleted;
    }

    // Номер проекта становится именем папки. Разрешены только буквы, цифры
    // и дефис — иначе «номер» вроде ..\..\Windows вывел бы запись за пределы папки.
    private static string CheckProjectId(string projectId) =>
        SafeIdPattern().IsMatch(projectId)
            ? projectId
            : throw new ArgumentException($"Недопустимый номер проекта: «{projectId}»", nameof(projectId));

    private static void DeleteOldest(string projectFolder, int keepCount)
    {
        foreach (var path in BackupFiles(projectFolder).OrderByDescending(SavedAt).Skip(keepCount))
            File.Delete(path);
    }

    private static IEnumerable<string> BackupFiles(string projectFolder) =>
        Directory.GetFiles(projectFolder, "*" + ProjectArchive.FileExtension);

    /// <summary>Время записи берётся из имени файла: оно не меняется при копировании папки.</summary>
    private static DateTime SavedAt(string path) =>
        DateTime.TryParseExact(Path.GetFileNameWithoutExtension(path), TimeFormat, CultureInfo.InvariantCulture,
            DateTimeStyles.None, out var time)
            ? time
            : File.GetLastWriteTime(path);

    private static string? ReadProjectName(string projectFolder)
    {
        try
        {
            var text = File.ReadAllText(Path.Combine(projectFolder, InfoFileName));
            return JsonSerializer.Deserialize<BackupInfo>(text)?.ProjectName;
        }
        catch (Exception error) when (error is IOException or JsonException or UnauthorizedAccessException)
        {
            return null;
        }
    }

    private sealed record BackupInfo(string ProjectName);

    [GeneratedRegex("^[A-Za-z0-9-]{1,64}$")]
    private static partial Regex SafeIdPattern();
}
