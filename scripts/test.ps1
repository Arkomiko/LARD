# Запускает все тесты: интерфейса (Vitest) и движка (xUnit).
# Запуск из корня репозитория:
#   powershell -ExecutionPolicy Bypass -File scripts/test.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$failed = @()

Push-Location (Join-Path $root "app/ui")
try {
    npm test
    if ($LASTEXITCODE -ne 0) { $failed += "интерфейс" }
}
finally {
    Pop-Location
}

dotnet test (Join-Path $root "app/MiliPlain.slnx")
if ($LASTEXITCODE -ne 0) { $failed += "движок" }

if ($failed.Count -gt 0) { throw "Есть упавшие тесты: $($failed -join ', ')" }
Write-Host ""
Write-Host "Все тесты прошли."
