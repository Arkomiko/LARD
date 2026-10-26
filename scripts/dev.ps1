# Режим разработки: интерфейс с dev-сервера Vite (правки видны сразу, без пересборки)
# в окне MiliPlain. Открывает отдельное окно консоли для Vite и запускает оболочку.
# Запуск из корня репозитория:
#   powershell -ExecutionPolicy Bypass -File scripts/dev.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$ui = Join-Path $root "app/ui"

# Vite — в своём окне: его вывод (ошибки сборки) удобно видеть отдельно.
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ui'; npm run dev"

# --ui-dev: оболочка берёт страницу с http://localhost:5173 вместо папки ui.
dotnet run --project (Join-Path $root "app/shell") -- --ui-dev
