using System.IO.Compression;

namespace MiliPlain.Engine.Tests;

public class ProjectArchiveTests
{
    private const string SampleJson = """{ "format": "miliplain-project", "name": "Трек «ё»" }""";

    [Fact]
    public void Записанный_проект_читается_обратно_без_потерь()
    {
        using var folder = new TemporaryFolder();
        var path = folder.File("трек.mpj");
        ProjectArchive.Write(path, SampleJson);
        Assert.Equal(SampleJson, ProjectArchive.Read(path));
    }

    [Fact]
    public void Файл_проекта_это_обычный_zip_с_project_json()
    {
        using var folder = new TemporaryFolder();
        var path = folder.File("трек.mpj");
        ProjectArchive.Write(path, SampleJson);
        using var zip = ZipFile.OpenRead(path);
        Assert.Equal(["project.json"], zip.Entries.Select(entry => entry.FullName));
    }

    [Fact]
    public void Перезапись_не_оставляет_временных_файлов()
    {
        using var folder = new TemporaryFolder();
        var path = folder.File("трек.mpj");
        ProjectArchive.Write(path, SampleJson);
        ProjectArchive.Write(path, """{ "second": true }""");
        Assert.Equal("""{ "second": true }""", ProjectArchive.Read(path));
        Assert.Equal(["трек.mpj"], Directory.GetFiles(folder.Path).Select(Path.GetFileName));
    }

    [Fact]
    public void Ошибка_посреди_записи_не_портит_старый_файл()
    {
        using var folder = new TemporaryFolder();
        var path = folder.File("трек.mpj");
        ProjectArchive.Write(path, SampleJson);
        Assert.Throws<IOException>(() => AtomicFile.Write(path, _ => throw new IOException("диск переполнен")));
        Assert.Equal(SampleJson, ProjectArchive.Read(path));
        Assert.Single(Directory.GetFiles(folder.Path));
    }

    [Fact]
    public void Не_zip_понятная_ошибка()
    {
        using var folder = new TemporaryFolder();
        var path = folder.File("не-проект.mpj");
        File.WriteAllText(path, "это просто текст");
        var error = Assert.Throws<ProjectFileException>(() => ProjectArchive.Read(path));
        Assert.Contains("архив не читается", error.Message);
    }

    [Fact]
    public void Zip_без_project_json_понятная_ошибка()
    {
        using var folder = new TemporaryFolder();
        var path = folder.File("чужой.mpj");
        using (var zip = ZipFile.Open(path, ZipArchiveMode.Create))
            zip.CreateEntry("readme.txt");
        var error = Assert.Throws<ProjectFileException>(() => ProjectArchive.Read(path));
        Assert.Contains("нет project.json", error.Message);
    }

    [Fact]
    public void Несуществующий_файл_понятная_ошибка()
    {
        using var folder = new TemporaryFolder();
        var error = Assert.Throws<ProjectFileException>(() => ProjectArchive.Read(folder.File("нет.mpj")));
        Assert.Contains("не найден", error.Message);
    }
}
