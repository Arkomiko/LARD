using System.Text.Json;
using MiliPlain.Engine;

namespace MiliPlain.Shell;

/// <summary>
/// Методы, которые может вызвать интерфейс. Имена совпадают с теми, что
/// в app/ui/src/host/hostApi.ts (createShellHostApi) — меняются вместе.
/// </summary>
internal static class HostMethods
{
    private const string ProjectFileFilter = "Проект MiliPlain (*.mpj)|*.mpj";

    public static void RegisterAll(MessageRouter router, ShellServices services, MainWindow window)
    {
        services.LoadSettings();

        router.Register("app.getInfo", _ => new { version = AppVersion.Display, dataFolder = services.Folders.Root });

        router.Register("settings.load", _ => services.Settings);
        router.Register("settings.save", parameters =>
        {
            var requested = parameters.GetProperty("settings").Deserialize<AppSettings>(MessageRouter.JsonOptions)
                ?? AppSettings.Default;
            services.Settings = services.SettingsStore.Save(requested);
            return services.Settings;
        });

        router.Register("project.showOpenDialog", _ =>
        {
            using var dialog = new OpenFileDialog { Filter = ProjectFileFilter, Title = "Открыть проект" };
            return dialog.ShowDialog(window) == DialogResult.OK ? ReadProject(dialog.FileName) : null;
        });
        router.Register("project.read", parameters => ReadProject(Text(parameters, "path")));
        router.Register("project.write", parameters =>
        {
            WriteProject(services, Text(parameters, "path"), Text(parameters, "projectText"));
            return null;
        });
        router.Register("project.showSaveDialog", parameters =>
        {
            using var dialog = new SaveFileDialog
            {
                Filter = ProjectFileFilter,
                Title = "Сохранить проект",
                FileName = FileNames.Safe(Text(parameters, "suggestedName")) + ProjectArchive.FileExtension,
                OverwritePrompt = true,
            };
            if (dialog.ShowDialog(window) != DialogResult.OK) return null;
            WriteProject(services, dialog.FileName, Text(parameters, "projectText"));
            return dialog.FileName;
        });

        router.Register("backup.write", parameters =>
        {
            var path = services.Autosave.Write(
                Text(parameters, "projectId"), Text(parameters, "projectName"), Text(parameters, "projectText"),
                services.Settings.AutosaveKeepCount, DateTime.Now);
            services.Log.Info($"Резервная копия: {path}");
            return null;
        });
        router.Register("backup.list", _ => services.Autosave.List());

        router.Register("window.setState", parameters =>
        {
            window.SetState(Text(parameters, "title"), parameters.GetProperty("hasUnsavedChanges").GetBoolean());
            return null;
        });
        router.Register("dialog.askSaveChanges", parameters =>
        {
            var answer = MessageBox.Show(window,
                $"Сохранить изменения в проекте «{Text(parameters, "projectName")}»?",
                "MiliPlain", MessageBoxButtons.YesNoCancel, MessageBoxIcon.Question);
            return answer switch
            {
                DialogResult.Yes => "save",
                DialogResult.No => "discard",
                _ => "cancel",
            };
        });
        router.Register("window.close", _ =>
        {
            window.CloseConfirmed();
            return null;
        });
    }

    private static object ReadProject(string path) => new { path, projectText = ProjectArchive.Read(path) };

    private static void WriteProject(ShellServices services, string path, string projectText)
    {
        ProjectArchive.Write(path, projectText);
        services.Log.Info($"Проект сохранён: {path}");
    }

    private static string Text(JsonElement parameters, string name) =>
        parameters.GetProperty(name).GetString() ?? throw new ArgumentException($"Нет параметра «{name}»");
}
