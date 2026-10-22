#requires -Version 7.0
param([string]$RuntimeRoot=(Join-Path $env:LOCALAPPDATA 'LTU\Assessor'))
$ErrorActionPreference='Stop'
$config=Join-Path $RuntimeRoot 'worker-config.json'
if(!(Test-Path -LiteralPath $config)){throw 'Worker authentication is not configured. Complete the reviewed secret setup first.'}
$settings=Get-Content -LiteralPath $config -Raw | ConvertFrom-Json
if(!(Test-Path -LiteralPath $settings.tokenFile)){throw 'Private local worker token is missing.'}
if((Get-Content -LiteralPath $settings.tokenFile -Raw).Trim().Length -lt 32){throw 'Invalid private token file.'}
if((Invoke-RestMethod 'http://127.0.0.1:8783/health' -TimeoutSec 3).status -ne 'ok'){throw 'Start the selected local assessor first.'}
$nodeCommand=Get-Command node -ErrorAction SilentlyContinue
if(!$nodeCommand){throw 'Run from the configured Node.js development shell.'}
$marker=Join-Path $PSScriptRoot 'assessment-worker.mjs'
$manifest=Join-Path $RuntimeRoot 'worker-process.json'
if(Test-Path -LiteralPath $manifest){$old=Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json;$active=Get-CimInstance Win32_Process -Filter "ProcessId = $($old.pid)";if($active -and $active.CommandLine.Contains($marker)){throw 'An existing worker is already running.'}}
$worker=Start-Process -FilePath $nodeCommand.Source -ArgumentList @('"'+$marker+'"','"'+$config+'"') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $RuntimeRoot 'worker.stdout.log') -RedirectStandardError (Join-Path $RuntimeRoot 'worker.stderr.log')
@{pid=$worker.Id;script=$marker} | ConvertTo-Json | Set-Content -LiteralPath $manifest -Encoding utf8
Write-Output 'Outbound-only local worker started. No firewall, public listener, paid API or Windows autostart was enabled.'
