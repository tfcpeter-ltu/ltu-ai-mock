#requires -Version 7.0
param([string]$RuntimeRoot=(Join-Path $env:LOCALAPPDATA 'LTU\Assessor'))
$ErrorActionPreference='Stop'
$manifest=Join-Path $RuntimeRoot 'worker-process.json'
if(!(Test-Path -LiteralPath $manifest)){Write-Output 'No worker process manifest.';return}
$saved=Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json
$active=Get-CimInstance Win32_Process -Filter "ProcessId = $($saved.pid)"
if($active -and $active.CommandLine.Contains($saved.script)){Stop-Process -Id $saved.pid;Write-Output 'Stopped verified outbound worker.'}
elseif($active){throw 'PID belongs to a different process; it was retained.'}
