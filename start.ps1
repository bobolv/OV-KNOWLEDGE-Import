$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Test-Path -LiteralPath '.env')) {
    $securePortalPassword = Read-Host '设置工作台登录密码（至少6字符）' -AsSecureString
    $portalCredential = [System.Net.NetworkCredential]::new('', $securePortalPassword)
    $portalPasswordValue = $portalCredential.Password
    if ($portalPasswordValue.Length -lt 6 -or $portalPasswordValue.Contains("'") -or $portalPasswordValue.Contains("`n")) { throw '密码至少6字符，不能包含单引号或换行。' }
    [IO.File]::WriteAllText((Join-Path $PSScriptRoot '.env'), "PORTAL_PASSWORD='$portalPasswordValue'", [Text.UTF8Encoding]::new($false))
    $portalPasswordValue = $null
    $portalCredential = $null
}
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw 'Docker启动失败，请检查输出。' }
Write-Host '工作台已启动：http://127.0.0.1:8787'
Start-Process 'http://127.0.0.1:8787'
