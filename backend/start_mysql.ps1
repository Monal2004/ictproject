# Start the portable MySQL server used by CivicVoice.
# Run from anywhere: .\backend\start_mysql.ps1
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
$mysqlIni = $settings['MYSQL_INI']
if (-not $mysqlHome -or -not $mysqlIni) {
    throw "MYSQL_HOME and MYSQL_INI must be set in backend/.env."
}

$mysqld = Join-Path $mysqlHome 'bin\mysqld.exe'
if (-not (Test-Path $mysqld)) {
    throw "mysqld.exe was not found at $mysqld."
}
if (-not (Test-Path $mysqlIni)) {
    throw "MySQL configuration was not found at $mysqlIni."
}

if (Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue) {
    Write-Host 'MySQL is already listening on 127.0.0.1:3306.'
    exit 0
}

Write-Host "Starting MySQL from $mysqld ..."
$process = Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=$mysqlIni" -WindowStyle Hidden -PassThru

for ($attempt = 1; $attempt -le 30; $attempt++) {
    Start-Sleep -Seconds 1
    if (Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue) {
        Write-Host "MySQL is ready on 127.0.0.1:3306 (PID $($process.Id))."
        exit 0
    }
    if ($process.HasExited) {
        throw "MySQL exited before becoming ready. Check the error log configured in $mysqlIni."
    }
}

throw 'MySQL did not open port 3306 within 30 seconds. Check the MySQL error log.'
