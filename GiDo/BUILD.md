# Как собрать MiliPlain с нуля

## 1. Что установить

| Что | Зачем | Где взять |
| --- | --- | --- |
| Windows 10 64-bit или новее | система, под которую пишется программа | — |
| Git | получить исходный код | git-scm.com |
| .NET 10 SDK | движок и оболочка (C#) | dot.net |
| Node.js 24 LTS или новее | сборка и тесты интерфейса (TypeScript) | nodejs.org |
| Visual Studio 2026 или Build Tools for Visual Studio с компонентом «Разработка классических приложений на C++» и CMake 3.21+ | только для моста (C++), с этапа 5 | visualstudio.microsoft.com, cmake.org |

WebView2 Runtime, в котором показывается интерфейс, уже входит в Windows 10
и 11 с обновлениями. Отдельно ставить его не нужно.

## 2. Собрать программу

Из корня репозитория одной командой:

```
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
```

Скрипт при первом запуске скачает инструменты интерфейса (`npm ci`), соберёт
интерфейс (`npm run build`) и затем движок с оболочкой (`dotnet build`).
Готовая программа:

```
app/shell/bin/Release/net10.0-windows/MiliPlain.exe
```

То же самое руками:

```
cd app/ui
npm ci
npm run build
cd ..
dotnet build MiliPlain.slnx -c Release
```

Порядок важен: оболочка при сборке копирует к себе собранный интерфейс
(`app/ui/dist`). Если собрать оболочку раньше, окно покажет подсказку
«Интерфейс MiliPlain не собран».

## 3. Запустить тесты

```
powershell -ExecutionPolicy Bypass -File scripts/test.ps1
```

Или по отдельности: `npm test` в `app/ui` (интерфейс) и `dotnet test`
в `app` (движок).

## 4. Режим разработки

```
powershell -ExecutionPolicy Bypass -File scripts/dev.ps1
```

Откроется окно консоли с dev-сервером Vite и окно MiliPlain, которое берёт
интерфейс с него (`MiliPlain.exe --ui-dev`). Правки в `app/ui/src` видны
в окне сразу, без пересборки. В этом режиме работают инструменты разработчика
WebView2 (F12), а на порту 9222 открыт протокол отладки: к нему подключаются
отладчик VS Code («Attach to Microsoft Edge», порт 9222) и автотесты.
Правки C#-кода требуют перезапуска.

Интерфейс можно открыть и в обычном браузере (`npm run dev`, адрес
http://localhost:5173). Всё, кроме работы с файлами, там работает, а файловые
команды честно сообщают, что оболочки нет.

## 5. Проверить стиль кода

```
cd app/ui
npm run check     # проверить
npm run format    # исправить то, что исправляется само
```

## Где программа хранит данные

| Что | Где |
| --- | --- |
| Настройки | `%APPDATA%\MiliPlain\settings.json` |
| Резервные копии | `%APPDATA%\MiliPlain\autosave\` |
| Журнал работы | `%APPDATA%\MiliPlain\logs\` |
| Кэш WebView2 | `%LOCALAPPDATA%\MiliPlain\WebView2\` |

## Мост MiliPlain Bridge (с этапа 5)

Мост собирается из трёх открытых SDK. Все под лицензией MIT.

| SDK | Где | Версия |
| --- | --- | --- |
| CLAP SDK | github.com/free-audio/clap | последняя |
| clap-wrapper (делает из CLAP-плагина VST3) | github.com/free-audio/clap-wrapper | последняя |
| VST3 SDK | github.com/steinbergmedia/vst3sdk | **строго та, на которой закреплён clap-wrapper** (сейчас `v3.8.0_build_66`) |

Почему VST3 SDK нельзя брать новее — запись «Версия VST3 SDK для моста»
в [DECISIONS.md](DECISIONS.md). Как SDK попадают в сборку (скачиваются
при сборке или лежат рядом), решается на этапе 5. В репозитории их не будет.
