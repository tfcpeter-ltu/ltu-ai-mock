param([string]$RuntimeRoot = (Join-Path $env:LOCALAPPDATA 'LTU\LanguageTool'))
$ErrorActionPreference='Stop'
$state=Get-Content -LiteralPath (Join-Path $RuntimeRoot 'processes.json') -Raw | ConvertFrom-Json
foreach($entry in @(@{pid=$state.enginePid;marker='org.languagetool.server.HTTPServer'},@{pid=$state.gatewayPid;marker=$state.gatewayScript})){
 $process=Get-CimInstance Win32_Process -Filter "ProcessId=$($entry.pid)"
 if($process -and $process.CommandLine.Contains($entry.marker)){Stop-Process -Id $entry.pid -ErrorAction Stop}
 elseif($process){throw "PID $($entry.pid) no longer belongs to this service; not stopped."}
}
Write-Output 'Verified service processes stopped. Runtime files and learning data were retained.'
