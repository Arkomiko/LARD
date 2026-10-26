using System.IO.Compression;
using System.Text;

namespace MiliPlain.Engine;

/// <summary>
/// Файл проекта .mpj — это обычный ZIP-архив (его можно открыть архиватором),
/// внутри которого лежит project.json. Что внутри project.json, движок не знает
/// и не проверяет: формат проекта принадлежит интерфейсу (app/ui/src/files).
/// Позже в архив добавятся вложения; старые версии программы просто не будут
/// их замечать.
/// </summary>
public static class ProjectArchive
{
    public const string ProjectEntryName = "project.json";
    public const string FileExtension = ".mpj";

    /// <summary>Больше этого project.json не бывает; защита от испорченных и «раздутых» архивов.</summary>
    private const long MaxProjectJsonBytes = 256L * 1024 * 1024;

    public static void Write(string path, string projectJson) =>
        AtomicFile.Write(path, stream =>
        {
            using var zip = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true);
            var entry = zip.CreateEntry(ProjectEntryName, CompressionLevel.Optimal);
            using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
            writer.Write(projectJson);
        });

    /// <summary>Текст project.json из архива. Понятная ошибка, если файл не архив или в нём нет проекта.</summary>
    public static string Read(string path)
    {
        try
        {
            using var zip = ZipFile.OpenRead(path);
            var entry = zip.GetEntry(ProjectEntryName)
                ?? throw new ProjectFileException("В архиве нет project.json — это не проект MiliPlain.");
            if (entry.Length > MaxProjectJsonBytes)
                throw new ProjectFileException("project.json в архиве слишком большой — файл, вероятно, повреждён.");
            using var reader = new StreamReader(entry.Open(), Encoding.UTF8);
            return reader.ReadToEnd();
        }
        catch (InvalidDataException)
        {
            throw new ProjectFileException("Файл повреждён или это не проект MiliPlain: архив не читается.");
        }
        catch (FileNotFoundException)
        {
            throw new ProjectFileException($"Файл не найден: {path}");
        }
        catch (DirectoryNotFoundException)
        {
            throw new ProjectFileException($"Папка не найдена: {path}");
        }
        catch (UnauthorizedAccessException)
        {
            throw new ProjectFileException($"Нет доступа к файлу: {path}");
        }
    }
}

/// <summary>Ошибка с файлом проекта. Текст сообщения показывается пользователю как есть.</summary>
public sealed class ProjectFileException(string message) : Exception(message);
