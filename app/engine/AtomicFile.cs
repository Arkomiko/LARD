using System.Text;

namespace MiliPlain.Engine;

/// <summary>
/// Надёжная запись файла: содержимое сначала пишется во временный файл рядом
/// с нужным, а потом одним действием подменяет его. Если посреди записи
/// кончится место на диске или выключат свет, старый файл останется целым,
/// а не окажется обрезанным наполовину.
/// </summary>
public static class AtomicFile
{
    public static void Write(string path, Action<Stream> writeContent)
    {
        var fullPath = Path.GetFullPath(path);
        var folder = Path.GetDirectoryName(fullPath)
            ?? throw new ArgumentException($"У пути нет папки: {path}", nameof(path));
        Directory.CreateDirectory(folder);

        // Временный файл — в той же папке: подмена внутри одного диска
        // происходит мгновенно и целиком.
        var temporaryPath = Path.Combine(folder, $".{Path.GetFileName(fullPath)}.{Guid.NewGuid():N}.tmp");
        try
        {
            using (var stream = new FileStream(temporaryPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                writeContent(stream);
                stream.Flush(flushToDisk: true);
            }
            File.Move(temporaryPath, fullPath, overwrite: true);
        }
        finally
        {
            TryDelete(temporaryPath);
        }
    }

    public static void WriteText(string path, string text) =>
        Write(path, stream =>
        {
            using var writer = new StreamWriter(stream, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false), leaveOpen: true);
            writer.Write(text);
        });

    private static void TryDelete(string path)
    {
        try
        {
            if (File.Exists(path)) File.Delete(path);
        }
        catch (IOException)
        {
            // Не удалось убрать временный файл — не беда, главное, что запись не сломана.
        }
    }
}
