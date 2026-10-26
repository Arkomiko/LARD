using System.Net;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace MiliPlain.Shell;

/// <summary>
/// Главное окно: внутри — WebView2 с интерфейсом (app/ui). Окно отвечает
/// за загрузку страницы, передачу сообщений и вопрос о несохранённом при закрытии.
/// </summary>
internal sealed class MainWindow : Form
{
    /// <summary>
    /// Адрес, под которым страница интерфейса открывается из папки ui рядом с exe.
    /// Домен .example зарезервирован и никогда не существует в интернете.
    /// </summary>
    private const string VirtualHost = "miliplain.example";

    private readonly WebView2 webView = new() { Dock = DockStyle.Fill };
    private readonly ShellServices services;
    private readonly ShellOptions options;
    private readonly MessageRouter router;
    private bool hasUnsavedChanges;
    private bool closeConfirmed;

    public MainWindow(ShellServices services, ShellOptions options)
    {
        this.services = services;
        this.options = options;
        router = new MessageRouter(services.Log, PostJson);
        HostMethods.RegisterAll(router, services, this);

        Text = "MiliPlain";
        ClientSize = new Size(1280, 800);
        MinimumSize = new Size(640, 400);
        StartPosition = FormStartPosition.CenterScreen;
        Controls.Add(webView);
        Load += async (_, _) => await InitializeWebViewAsync();
        FormClosing += OnFormClosing;
    }

    /// <summary>Заголовок окна и отметка «есть несохранённое» — их сообщает интерфейс.</summary>
    public void SetState(string title, bool unsavedChanges)
    {
        Text = title;
        hasUnsavedChanges = unsavedChanges;
    }

    /// <summary>Интерфейс разобрался с несохранённым — теперь окно можно закрыть.</summary>
    public void CloseConfirmed()
    {
        closeConfirmed = true;
        // Закрываем после выхода из обработчика, чтобы ответ интерфейсу успел уйти.
        BeginInvoke(Close);
    }

    private async Task InitializeWebViewAsync()
    {
        // Кэш WebView2 — в локальной (не перемещаемой) папке пользователя.
        var userDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MiliPlain", "WebView2");
        // В режиме разработки открывается порт отладки: к нему подключаются
        // отладчик VS Code («Attach to Edge») и автотесты (Playwright).
        var browserArguments = options.IsDevelopment ? $"--remote-debugging-port={ShellOptions.DevDebugPort}" : null;
        var environment = await CoreWebView2Environment.CreateAsync(
            null, userDataFolder, new CoreWebView2EnvironmentOptions(browserArguments));
        await webView.EnsureCoreWebView2Async(environment);
        var core = webView.CoreWebView2;

        // SmartScreen проверял бы репутацию нашего выдуманного адреса по сети —
        // это 2 секунды лишнего ожидания при запуске (замер этапа 0).
        core.Settings.IsReputationCheckingRequired = false;
        // Ctrl+колесо понадобится пианороллу, а не масштабу страницы.
        core.Settings.IsZoomControlEnabled = false;
        // Инструменты разработчика (F12) и стандартное меню — только в режиме разработки.
        core.Settings.AreDevToolsEnabled = options.IsDevelopment;
        core.Settings.AreDefaultContextMenusEnabled = options.IsDevelopment;
        core.WebMessageReceived += (_, message) => router.Handle(message.WebMessageAsJson);

        if (options.UiDevServer is { } devServer)
        {
            core.Navigate(devServer.ToString());
            return;
        }
        var uiFolder = Path.Combine(AppContext.BaseDirectory, "ui");
        if (!File.Exists(Path.Combine(uiFolder, "index.html")))
        {
            core.NavigateToString(MissingUiPage(uiFolder));
            return;
        }
        core.SetVirtualHostNameToFolderMapping(VirtualHost, uiFolder, CoreWebView2HostResourceAccessKind.Allow);
        core.Navigate($"https://{VirtualHost}/index.html");
    }

    private void OnFormClosing(object? sender, FormClosingEventArgs closing)
    {
        // Есть несохранённое — не закрываемся, а спрашиваем интерфейс: он знает
        // проект и задаст вопрос «Сохранить изменения?». Потом вызовет CloseConfirmed.
        if (!hasUnsavedChanges || closeConfirmed || webView.CoreWebView2 is null) return;
        closing.Cancel = true;
        router.SendEvent("closeRequested");
    }

    private void PostJson(string json) => webView.CoreWebView2?.PostWebMessageAsJson(json);

    private static string MissingUiPage(string uiFolder) => $"""
        <!doctype html><meta charset="utf-8">
        <body style="font-family:Segoe UI,sans-serif;padding:32px;background:#16181d;color:#d8dbe2">
        <h2>Интерфейс MiliPlain не собран</h2>
        <p>Не найден файл <code>{WebUtility.HtmlEncode(Path.Combine(uiFolder, "index.html"))}</code>.</p>
        <p>Соберите интерфейс и затем оболочку:</p>
        <pre>cd app/ui
        npm install
        npm run build
        cd ..
        dotnet build</pre>
        <p>Или запустите <code>scripts/build.ps1</code>. Подробности — в GiDo/BUILD.md.</p>
        </body>
        """;
}
