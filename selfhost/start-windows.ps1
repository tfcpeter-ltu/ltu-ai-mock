param([string]$RuntimeRoot = (Join-Path $env:LOCALAPPDATA 'LTU\LanguageTool'))
$ErrorActionPreference='Stop'
$runtime=[IO.Path]::GetFullPath($RuntimeRoot)
$manifest=Get-Content -LiteralPath (Join-Path $runtime 'runtime-manifest.json') -Raw | ConvertFrom-Json
$gatewayScript=Join-Path $PSScriptRoot 'gateway.mjs'
foreach($port in @(8081,8781)){if(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue){throw "Port $port is already in use. Existing process was not stopped."}}
$javaArgs=@('-Xms128m','-Xmx768m','-cp','languagetool-server.jar','org.languagetool.server.HTTPServer','--config',('"'+(Join-Path $runtime 'server.properties')+'"'),'--port','8081')
$engine=Start-Process -FilePath $manifest.javaExecutable -ArgumentList $javaArgs -WorkingDirectory $manifest.engineDirectory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'engine.stdout.log') -RedirectStandardError (Join-Path $runtime 'engine.stderr.log')
$env:LT_GATEWAY_TOKEN_FILE=Join-Path $runtime 'gateway-token.txt'
$env:LT_GATEWAY_HOST='127.0.0.1'
$env:LT_GATEWAY_LOCAL_UI='1'
$env:LT_ENGINE_URL='http://127.0.0.1:8081/v2/check'
try{$gateway=Start-Process -FilePath $manifest.nodeExecutable -ArgumentList @('"'+$gatewayScript+'"') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'gateway.stdout.log') -RedirectStandardError (Join-Path $runtime 'gateway.stderr.log')}
finally{Remove-Item Env:LT_GATEWAY_TOKEN_FILE,Env:LT_GATEWAY_HOST,Env:LT_GATEWAY_LOCAL_UI,Env:LT_ENGINE_URL -ErrorAction SilentlyContinue}
@{runtimeRoot=$runtime;enginePid=$engine.Id;gatewayPid=$gateway.Id;engineExecutable=$manifest.javaExecutable;gatewayScript=$gatewayScript} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtime 'processes.json') -Encoding utf8
Write-Output 'LanguageTool and authenticated gateway started on loopback only. This does not make the service available to remote students.'
Write-Output 'Local verification page: http://127.0.0.1:8781/'
