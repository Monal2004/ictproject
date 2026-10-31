# Stop the portable MySQL server used by CivicVoice.
# Run from anywhere: .\backend\stop_mysql.ps1
$ErrorActionPreference = 'Stop'

$envFile = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path $envFile)) {
    throw "Missing backend/.env. Copy backend/.env.example to backend/.env and fill in the values."
}

$settings = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        $settings[$matches[1].Trim()] = $matches[2].Trim()
    }
}

$mysqlHome = $settings['MYSQL_HOME']
$rootPassword = $settings['MYSQL_ROOT_PASSWORD']
if (-not $mysqlHome) {
    throw "MYSQL_HOME must be set in backend/.env."
}
if (-not $rootPassword) {
    throw "MYSQL_ROOT_PASSWORD must be set in backend/.env to shut down MySQL."
}

$mysqladmin = Join-Path $mysqlHome 'bin\mysqladmin.exe'
if (-not (Test-Path $mysqladmin)) {
    throw "mysqladmin.exe was not found at $mysqladmin."
}

if (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue)) {
    Write-Host 'MySQL is not running on 127.0.0.1:3306.'
    exit 0
}

$env:MYSQL_PWD = $rootPassword
try {
    & $mysqladmin -h 127.0.0.1 -u root shutdown
    if ($LASTEXITCODE -ne 0) {
        throw 'mysqladmin could not shut down MySQL.'
    }
} finally {
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}

Write-Host 'MySQL has been shut down.'
