namespace MiliPlain.Engine;

/// <summary>
/// Имя файла из имени проекта или паттерна. Символы, запрещённые в именах
/// файлов Windows (\ / : * ? " &lt; &gt; |), заменяются на «_», а имена,
/// зарезервированные системой (CON, NUL, COM1…), получают «_» в начале.
/// Правила Windows применяются на любой системе: файл, созданный на macOS,
/// должен открываться и на Windows.
/// </summary>
public static class FileNames
{
    private static readonly char[] ForbiddenCharacters = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];

    private static readonly HashSet<string> ReservedNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
    };

    public static string Safe(string name, string fallback = "MiliPlain")
    {
        var characters = name.Select(character =>
            character < ' ' || ForbiddenCharacters.Contains(character) ? '_' : character).ToArray();
        // Windows не любит точки и пробелы в конце имени: молча их отрезает.
        var cleaned = new string(characters).Trim().TrimEnd('.', ' ');
        if (cleaned.Length == 0) cleaned = fallback;
        return ReservedNames.Contains(cleaned) ? "_" + cleaned : cleaned;
    }
}
