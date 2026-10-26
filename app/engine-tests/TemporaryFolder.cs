namespace MiliPlain.Engine.Tests;

/// <summary>Временная папка для одного теста. Удаляется после теста (using).</summary>
public sealed class TemporaryFolder : IDisposable
{
    public TemporaryFolder()
    {
        Path = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "MiliPlainTests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Path);
    }

    public string Path { get; }

    public string File(string name) => System.IO.Path.Combine(Path, name);

    public void Dispose()
    {
        try
        {
            Directory.Delete(Path, recursive: true);
        }
        catch (IOException)
        {
            // Антивирус или индексатор держит файл — временная папка удалится системой позже.
        }
    }
}
