using MiliPlain.Engine;

namespace MiliPlain.Shell;

/// <summary>Точка входа MiliPlain.exe.</summary>
internal static class Program
{
    [STAThread]
    private static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();

        var folders = AppFolders.ForCurrentUser();
        var log = new FileLog(folders.Logs);
        log.Info($"Запуск MiliPlain {AppVersion.Display}");

        // Необработанная ошибка: записать в журнал и показать, а не исчезнуть молча.
        Application.ThreadException += (_, error) => ReportCrash(log, error.Exception);
        AppDomain.CurrentDomain.UnhandledException += (_, error) => ReportCrash(log, error.ExceptionObject as Exception);

        var services = new ShellServices(folders, log);
        services.CleanUpOldBackups();
        Application.Run(new MainWindow(services, ShellOptions.Parse(args)));
        log.Info("Выход");
    }

    private static void ReportCrash(FileLog log, Exception? error)
    {
        log.Error("Необработанная ошибка", error);
        MessageBox.Show(
            $"Произошла ошибка: {error?.Message}\n\nПодробности записаны в журнал:\n%APPDATA%\\MiliPlain\\logs",
            "MiliPlain", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}

/// <summary>Параметры запуска из командной строки.</summary>
internal sealed record ShellOptions(Uri? UiDevServer)
{
    /// <summary>Адрес Vite в режиме разработки (npm run dev). Порт задан в app/ui/vite.config.ts.</summary>
    public static readonly Uri DefaultDevServer = new("http://localhost:5173/");

    /// <summary>Порт отладки WebView2 в режиме разработки (стандартный порт Chrome DevTools).</summary>
    public const int DevDebugPort = 9222;

    /// <summary>--ui-dev — брать интерфейс не из папки ui, а с dev-сервера Vite (изменения видны сразу).</summary>
    public static ShellOptions Parse(string[] args) =>
        new(args.Contains("--ui-dev") ? DefaultDevServer : null);

    public bool IsDevelopment => UiDevServer is not null;
}

/// <summary>Версия программы — одна на всё, задана в app/Directory.Build.props.</summary>
internal static class AppVersion
{
    public static string Display { get; } =
        typeof(AppVersion).Assembly
            .GetCustomAttributes(typeof(System.Reflection.AssemblyInformationalVersionAttribute), false)
            .OfType<System.Reflection.AssemblyInformationalVersionAttribute>()
            .FirstOrDefault()?.InformationalVersion ?? "?";
}
