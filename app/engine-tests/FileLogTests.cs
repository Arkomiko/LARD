namespace MiliPlain.Engine.Tests;

public class FileLogTests
{
    [Fact]
    public void Пишет_строки_с_уровнем_и_временем()
    {
        using var folder = new TemporaryFolder();
        var time = new DateTime(2026, 10, 25, 16, 30, 0);
        var log = new FileLog(folder.Path, () => time);
        log.Info("запуск");
        log.Error("сбой", new InvalidOperationException("подробности"));

        var text = File.ReadAllText(folder.File("miliplain-2026-10-25.log"));
        Assert.Contains("2026-10-25 16:30:00.000 [INFO] запуск", text);
        Assert.Contains("[ERROR] сбой", text);
        Assert.Contains("подробности", text);
    }

    [Fact]
    public void Хранит_только_10_последних_дней()
    {
        using var folder = new TemporaryFolder();
        var day = new DateTime(2026, 10, 1);
        var log = new FileLog(folder.Path, () => day);
        for (var index = 0; index < 15; index++)
        {
            log.Info($"день {index}");
            day = day.AddDays(1);
        }

        var files = Directory.GetFiles(folder.Path).Select(Path.GetFileName).Order().ToList();
        Assert.Equal(10, files.Count);
        Assert.Equal("miliplain-2026-10-06.log", files[0]);
        Assert.Equal("miliplain-2026-10-15.log", files[^1]);
    }

    [Fact]
    public void Недоступная_папка_не_роняет_программу()
    {
        using var folder = new TemporaryFolder();
        var blocker = folder.File("это-файл-а-не-папка");
        File.WriteAllText(blocker, "");
        var log = new FileLog(blocker);
        log.Info("в никуда");
    }
}
