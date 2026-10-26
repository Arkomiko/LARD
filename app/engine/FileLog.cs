using System.Globalization;

namespace MiliPlain.Engine;

/// <summary>
/// Журнал работы программы. Пишется только на этом компьютере
/// (%APPDATA%\MiliPlain\logs) и никуда не отправляется (ТЗ, п. 6.9).
/// Один файл на день; хранятся последние 10 файлов, старые удаляются.
/// Ошибка записи журнала никогда не роняет программу.
/// </summary>
public sealed class FileLog(string folder, Func<DateTime>? clock = null)
{
    public const int KeepFiles = 10;

    private readonly Func<DateTime> now = clock ?? (() => DateTime.Now);
    private readonly object sync = new();
    private string? currentFile;

    public void Info(string message) => Write("INFO", message);

    public void Warning(string message) => Write("WARN", message);

    public void Error(string message, Exception? error = null) =>
        Write("ERROR", error is null ? message : $"{message}{Environment.NewLine}{error}");

    private void Write(string level, string message)
    {
        try
        {
            // Несколько потоков пишут в один файл — по очереди, иначе строки перемешаются.
            lock (sync)
            {
                var time = now();
                var path = Path.Combine(folder, $"miliplain-{time:yyyy-MM-dd}.log");
                Directory.CreateDirectory(folder);
                File.AppendAllText(path,
                    $"{time.ToString("yyyy-MM-dd HH:mm:ss.fff", CultureInfo.InvariantCulture)} [{level}] {message}{Environment.NewLine}");
                if (path != currentFile)
                {
                    currentFile = path;
                    DeleteOldFiles();
                }
            }
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException)
        {
            // Журнал недоступен (например, диск только для чтения) — работаем без него.
        }
    }

    // Имена файлов содержат дату, поэтому сортировка по имени = сортировка по дате.
    private void DeleteOldFiles()
    {
        foreach (var path in Directory.GetFiles(folder, "miliplain-*.log").OrderDescending().Skip(KeepFiles))
            File.Delete(path);
    }
}
