#requires -Version 7.0
param([string]$RuntimeRoot=(Join-Path $env:LOCALAPPDATA 'LTU\Assessor'))
$ErrorActionPreference='Stop'
$state=Get-Content -LiteralPath (Join-Path $RuntimeRoot 'processes.json') -Raw | ConvertFrom-Json
foreach($item in @(@{id=$state.enginePid;marker=$state.engineExecutable},@{id=$state.consolePid;marker=$state.consoleScript})){
 $process=Get-CimInstance Win32_Process -Filter "ProcessId = $($item.id)"
 if($process -and $process.CommandLine.Contains($item.marker)){Stop-Process -Id $item.id;Write-Output 'Stopped verified local assessor process.'}
 elseif($process){throw 'PID belongs to a different process; it was not stopped.'}
}
