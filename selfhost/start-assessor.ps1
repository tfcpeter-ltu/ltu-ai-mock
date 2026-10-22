#requires -Version 7.0
param([string]$RuntimeRoot=(Join-Path $env:LOCALAPPDATA 'LTU\Assessor'),[ValidateSet('8B','14B','3.5-9B')][string]$Model='8B')
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath($RuntimeRoot)
foreach($port in @(8782,8783)){if(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue){throw "Port $port already in use; existing process retained."}}
$engine=Get-ChildItem -LiteralPath (Join-Path $root 'llama-b11827') -Filter llama-server.exe -Recurse | Select-Object -First 1
if(!$engine){throw 'Run install-assessor.ps1 first'}
$modelFile=Join-Path $root $(if($Model -eq '3.5-9B'){'Qwen3.5-9B-Q4_K_M.gguf'}else{'Qwen3-'+$Model+'-Q4_K_M.gguf'})
if(!(Test-Path -LiteralPath $modelFile)){throw 'Selected model is not installed; run install-assessor.ps1 with the same -Model option.'}
$modelId=if($Model -eq '3.5-9B'){'Qwen3.5-9B-Q4_K_M@3885219b6810b007914f3a7950a8d1b469d598a5'}elseif($Model -eq '14B'){'Qwen3-14B-Q4_K_M@530227a7d994db8eca5ab5ced2fb692b614357fd'}else{'Qwen3-8B-Q4_K_M@7c41481f57cb95916b40956ab2f0b139b296d974'}
$layers=if($Model -eq '14B'){'24'}else{'99'}
$keyFile=Join-Path $root 'engine-key.txt'
if(!(Test-Path -LiteralPath $keyFile)){[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower() | Set-Content -LiteralPath $keyFile -NoNewline}
$arguments=@('-m',('"'+$modelFile+'"'),'--host','127.0.0.1','--port','8783','-c','8192','-ngl',$layers,'--parallel','1','--jinja','--no-webui','--no-slots','--log-disable','--api-key-file',('"'+$keyFile+'"'),'--cors-origins','http://127.0.0.1:8782','--no-cors-credentials')
$nodeCommand=Get-Command node -ErrorAction SilentlyContinue
$node=if($nodeCommand){$nodeCommand.Source}else{$null}
if(!$node){$languageManifest=Join-Path $env:LOCALAPPDATA 'LTU\LanguageTool\runtime-manifest.json';if(Test-Path -LiteralPath $languageManifest){$node=(Get-Content -LiteralPath $languageManifest -Raw | ConvertFrom-Json).nodeExecutable}}
if(!$node -or !(Test-Path -LiteralPath $node)){throw 'Node.js runtime not found; run from the configured Codex shell or install Node.js.'}
$process=Start-Process -FilePath $engine.FullName -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $root 'engine.stdout.log') -RedirectStandardError (Join-Path $root 'engine.stderr.log')
$script=Join-Path $PSScriptRoot 'assessor-server.mjs'
$env:LTU_ENGINE_KEY_FILE=$keyFile
$env:LTU_MODEL_ID=$modelId
if(Test-Path -LiteralPath (Join-Path $root 'official-rubrics.json')){$env:LTU_RUBRIC_FILE=Join-Path $root 'official-rubrics.json'}
try{$gateway=Start-Process -FilePath $node -ArgumentList @('"'+$script+'"') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $root 'console.stdout.log') -RedirectStandardError (Join-Path $root 'console.stderr.log')}
finally{Remove-Item Env:LTU_ENGINE_KEY_FILE,Env:LTU_RUBRIC_FILE,Env:LTU_MODEL_ID -ErrorAction SilentlyContinue}
@{enginePid=$process.Id;consolePid=$gateway.Id;engineExecutable=$engine.FullName;consoleScript=$script} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $root 'processes.json') -Encoding utf8
Write-Output 'Local-only assessment console: http://127.0.0.1:8782/ (model loading may take a minute).'
$ready=$false
for($i=0;$i -lt 30;$i++){try{if((Invoke-RestMethod 'http://127.0.0.1:8783/health' -TimeoutSec 1).status -eq 'ok'){$ready=$true;break}}catch{};Start-Sleep -Milliseconds 500}
if(!$ready){Write-Output 'Model is still loading; check health before submitting a review.'}
