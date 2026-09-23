# Áp dụng những migration chưa chạy trong migrations/, theo thứ tự số (Windows).
#
# Mỗi file chỉ chạy đúng MỘT lần. Tên file đã chạy được ghi vào bảng
# schema_migrations (xem migrations/000_migration_ledger.sql để biết vì sao
# không còn chạy lại toàn bộ được nữa).
#
# Chạy:
#   pwsh scripts/migrate.ps1              # áp dụng những file chưa chạy
#   pwsh scripts/migrate.ps1 -DryRun      # chỉ liệt kê, không chạy
#   pwsh scripts/migrate.ps1 -Status      # xem file nào đã chạy, file nào chưa
#   pwsh scripts/migrate.ps1 -Baseline    # đánh dấu TẤT CẢ là đã chạy, không chạy gì
#
# -Baseline dùng đúng một lần, cho CSDL đã tồn tại từ trước khi có sổ ghi.
param(
    [switch]$DryRun,
    [switch]$Status,
    [switch]$Baseline
)

$ErrorActionPreference = 'Stop'

$DbDir = Split-Path -Parent $PSScriptRoot
. "$PSScriptRoot\_env.ps1"

$envFile = Join-Path $DbDir '.env'
$envVars = Import-DotEnv -Path $envFile
$PgUser = $envVars['POSTGRES_USER']
$PgDb = $envVars['POSTGRES_DB']

$MigrationsDir = Join-Path $DbDir 'migrations'
$LedgerFile = Join-Path $MigrationsDir '000_migration_ledger.sql'

function Invoke-Psql {
    param([string]$Sql)
    $result = docker compose exec -T postgres psql -U $PgUser -d $PgDb -v ON_ERROR_STOP=1 -qtA -c $Sql
    if ($LASTEXITCODE -ne 0) {
        Write-Error "psql thất bại: $Sql"
        exit 1
    }
    return ($result | Out-String).Trim()
}

Push-Location $DbDir
try {
    docker compose exec -T postgres pg_isready -U $PgUser | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Postgres chưa sẵn sàng - chạy '.\scripts\deploy.ps1' trước."
        exit 1
    }

    # Sổ ghi phải tồn tại trước mọi thứ khác. File này idempotent.
    Get-Content -Raw -Encoding UTF8 $LedgerFile |
        docker compose exec -T postgres psql -U $PgUser -d $PgDb -v ON_ERROR_STOP=1 -q | Out-Null

    $files = Get-ChildItem -Path $MigrationsDir -Filter '*.sql' |
        Where-Object { $_.Name -match '^\d' } |
        Sort-Object Name

    if ($files.Count -eq 0) {
        Write-Host "Không có migration nào trong $MigrationsDir"
        exit 0
    }

    if ($Baseline) {
        foreach ($f in $files) {
            Invoke-Psql "INSERT INTO schema_migrations (filename) VALUES ('$($f.Name)') ON CONFLICT (filename) DO NOTHING" | Out-Null
        }
        Write-Host "Đã đánh dấu $($files.Count) migration là đã áp dụng, không chạy file nào."
        Write-Host "Chỉ dùng lệnh này cho CSDL đã có sẵn schema trước khi có sổ ghi."
        exit 0
    }

    $pending = @()
    foreach ($f in $files) {
        $found = Invoke-Psql "SELECT 1 FROM schema_migrations WHERE filename = '$($f.Name)'"
        if ($found -eq '1') {
            if ($Status) { Write-Host "  [đã chạy]  $($f.Name)" }
        } else {
            if ($Status) { Write-Host "  [chưa chạy] $($f.Name)" }
            $pending += $f
        }
    }

    if ($Status) {
        Write-Host "Tổng: $($files.Count) file, $($pending.Count) chưa chạy."
        exit 0
    }

    if ($pending.Count -eq 0) {
        Write-Host "Không có migration nào cần chạy. Schema đã cập nhật."
        exit 0
    }

    if ($DryRun) {
        Write-Host "Sẽ chạy $($pending.Count) migration theo thứ tự:"
        foreach ($f in $pending) { Write-Host "  $($f.Name)" }
        exit 0
    }

    Write-Host "Nhắc: hãy chắc chắn đã chạy '.\scripts\backup.ps1' nếu đây là dữ liệu thật."
    Write-Host "Áp dụng $($pending.Count) migration..."

    foreach ($f in $pending) {
        Write-Host "--- $($f.Name)"
        Get-Content -Raw -Encoding UTF8 $f.FullName |
            docker compose exec -T postgres psql -U $PgUser -d $PgDb -v ON_ERROR_STOP=1 -q
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Migration THẤT BẠI tại $($f.Name) - dừng lại, schema chưa hoàn tất.`nSửa file rồi chạy lại; những file trước đó đã được ghi nhận nên không chạy lại."
            exit 1
        }
        Invoke-Psql "INSERT INTO schema_migrations (filename) VALUES ('$($f.Name)') ON CONFLICT (filename) DO NOTHING" | Out-Null
    }

    Write-Host "Xong. Đã áp dụng $($pending.Count) migration."
} finally {
    Pop-Location
}
