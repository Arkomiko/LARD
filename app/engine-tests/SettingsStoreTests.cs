namespace MiliPlain.Engine.Tests;

public class SettingsStoreTests
{
    [Fact]
    public void Без_файла_настройки_по_умолчанию_из_ТЗ()
    {
        using var folder = new TemporaryFolder();
        var settings = new SettingsStore(folder.File("settings.json")).Load();
        Assert.Equal(new AppSettings(100, 5, 5), settings);
    }

    [Fact]
    public void Сохранённое_читается_обратно()
    {
        using var folder = new TemporaryFolder();
        var store = new SettingsStore(folder.File("settings.json"));
        store.Save(new AppSettings(250, 10, 3));
        Assert.Equal(new AppSettings(250, 10, 3), store.Load());
    }

    [Fact]
    public void Значения_за_границами_приводятся_к_допустимым()
    {
        using var folder = new TemporaryFolder();
        var store = new SettingsStore(folder.File("settings.json"));
        var saved = store.Save(new AppSettings(0, 500, 1000));
        Assert.Equal(new AppSettings(1, 120, 50), saved);
    }

    [Fact]
    public void Испорченный_файл_не_мешает_запуску()
    {
        using var folder = new TemporaryFolder();
        var path = folder.File("settings.json");
        File.WriteAllText(path, "{ это не json");
        Assert.Equal(AppSettings.Default, new SettingsStore(path).Load());
    }

    [Fact]
    public void Недостающие_поля_берутся_по_умолчанию()
    {
        using var folder = new TemporaryFolder();
        var path = folder.File("settings.json");
        File.WriteAllText(path, """{ "undoLimit": 42 }""");
        Assert.Equal(new AppSettings(42, 5, 5), new SettingsStore(path).Load());
    }

    [Fact]
    public void Имена_полей_как_в_интерфейсе()
    {
        using var folder = new TemporaryFolder();
        var path = folder.File("settings.json");
        new SettingsStore(path).Save(AppSettings.Default);
        var text = File.ReadAllText(path);
        Assert.Contains("\"undoLimit\"", text);
        Assert.Contains("\"autosaveIntervalMinutes\"", text);
        Assert.Contains("\"autosaveKeepCount\"", text);
    }
}
