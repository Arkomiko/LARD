namespace MiliPlain.Engine.Tests;

public class AutosaveStoreTests
{
    private static readonly DateTime Start = new(2026, 10, 25, 16, 0, 0);

    [Fact]
    public void Хранит_только_последние_копии()
    {
        using var folder = new TemporaryFolder();
        var store = new AutosaveStore(folder.Path);
        for (var minute = 0; minute < 8; minute++)
            store.Write("project-1", "Трек", $"{{ \"version\": {minute} }}", keepCount: 5, Start.AddMinutes(minute * 5));

        var backups = store.List();
        Assert.Equal(5, backups.Count);
        Assert.Equal(Start.AddMinutes(35), backups[0].SavedAt);
        Assert.Equal("""{ "version": 7 }""", ProjectArchive.Read(backups[0].Path));
        Assert.Equal(Start.AddMinutes(15), backups[^1].SavedAt);
    }

    [Fact]
    public void Список_знает_имя_проекта()
    {
        using var folder = new TemporaryFolder();
        var store = new AutosaveStore(folder.Path);
        store.Write("project-1", "Первый", "{}", 5, Start);
        store.Write("project-2", "Второй", "{}", 5, Start.AddMinutes(1));

        var backups = store.List();
        Assert.Equal(["Второй", "Первый"], backups.Select(backup => backup.ProjectName));
        Assert.Equal("project-1", backups[1].ProjectId);
    }

    [Theory]
    [InlineData("..\\..\\Windows")]
    [InlineData("a/b")]
    [InlineData("")]
    public void Опасный_номер_проекта_отклоняется(string projectId)
    {
        using var folder = new TemporaryFolder();
        var store = new AutosaveStore(folder.Path);
        Assert.Throws<ArgumentException>(() => store.Write(projectId, "Трек", "{}", 5, Start));
    }

    [Fact]
    public void Копии_проектов_нетронутых_месяц_удаляются()
    {
        using var folder = new TemporaryFolder();
        var store = new AutosaveStore(folder.Path);
        store.Write("old-project", "Старый", "{}", 5, Start);
        store.Write("fresh-project", "Свежий", "{}", 5, Start.AddDays(25));

        Assert.Equal(1, store.DeleteStale(Start.AddDays(31)));
        Assert.Equal(["fresh-project"], store.List().Select(backup => backup.ProjectId));
    }

    [Fact]
    public void Пустая_папка_пустой_список()
    {
        using var folder = new TemporaryFolder();
        Assert.Empty(new AutosaveStore(Path.Combine(folder.Path, "ещё-нет")).List());
    }
}
