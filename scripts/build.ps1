# Собирает MiliPlain целиком: сначала интерфейс (app/ui), потом движок и оболочку (app).
# Запуск из корня репозитория:
#   powershell -ExecutionPolicy Bypass -File scripts/build.ps1
# Готовая программа появится в app/shell/bin/Release/net10.0-windows/MiliPlain.exe

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location (Join-Path $root "app/ui")
try {
    # Пакеты ставятся только при первой сборке: npm ci каждый раз заново
    # скачивал бы всё, а это долго.
    if (-not (Test-Path "node_modules")) {
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "Не удалось установить пакеты интерфейса (npm ci)" }
    }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Сборка интерфейса не удалась" }
}
finally {
    Pop-Location
}

dotnet build (Join-Path $root "app/MiliPlain.slnx") -c Release
if ($LASTEXITCODE -ne 0) { throw "Сборка движка и оболочки не удалась" }

Write-Host ""
Write-Host "Готово: app/shell/bin/Release/net10.0-windows/MiliPlain.exe"
