param([string]$RuntimeRoot = (Join-Path $env:LOCALAPPDATA 'LTU\LanguageTool'))
$ErrorActionPreference='Stop'
$runtime=[IO.Path]::GetFullPath($RuntimeRoot)
if($env:OneDrive -and $runtime.StartsWith([IO.Path]::GetFullPath($env:OneDrive),[StringComparison]::OrdinalIgnoreCase)){throw 'Runtime must stay outside OneDrive.'}
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
$lockPath=Join-Path $PSScriptRoot 'runtime-versions.json'
$lock=if(Test-Path -LiteralPath $lockPath){Get-Content -LiteralPath $lockPath -Raw | ConvertFrom-Json}else{$null}
$jre=if($lock){@{binary=@{package=@{name=$lock.javaPackageName;link=$lock.javaUrl;checksum=$lock.javaSha256}};version=@{openjdk_version=$lock.javaVersion}}}else{(Invoke-RestMethod 'https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jre&os=windows&vendor=eclipse')[0]}
$javaZip=Join-Path $runtime $jre.binary.package.name
if(!(Test-Path -LiteralPath $javaZip)){Invoke-WebRequest $jre.binary.package.link -OutFile $javaZip}
if((Get-FileHash -LiteralPath $javaZip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $jre.binary.package.checksum){throw 'Java checksum mismatch.'}
$javaRoot=Join-Path $runtime 'java21'
if(!(Test-Path -LiteralPath $javaRoot)){Expand-Archive -LiteralPath $javaZip -DestinationPath $javaRoot}
$java=(Get-ChildItem -LiteralPath $javaRoot -Filter java.exe -Recurse | Select-Object -First 1).FullName
if(!$java){throw 'Java executable not found.'}
$ltVersion=if($lock){$lock.languageToolVersion}else{'6.6'}
$ltUrl="https://languagetool.org/download/LanguageTool-$ltVersion.zip"
$ltZip=Join-Path $runtime "LanguageTool-$ltVersion.zip"
if(!(Test-Path -LiteralPath $ltZip)){Invoke-WebRequest $ltUrl -OutFile $ltZip}
if($lock -and (Get-FileHash -LiteralPath $ltZip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $lock.languageToolSha256){throw 'LanguageTool archive differs from the previously verified installation.'}
$ltRoot=Join-Path $runtime "LanguageTool-$ltVersion"
if(!(Test-Path -LiteralPath (Join-Path $ltRoot 'languagetool-server.jar'))){Expand-Archive -LiteralPath $ltZip -DestinationPath $runtime}
$manifest=[ordered]@{languageToolVersion=$ltVersion;languageToolUrl=$ltUrl;languageToolSha256=(Get-FileHash -LiteralPath $ltZip -Algorithm SHA256).Hash.ToLowerInvariant();languageToolChecksumNote='Locally computed; official HTTPS download, no independently published digest verified.';javaVersion=$jre.version.openjdk_version;javaUrl=$jre.binary.package.link;javaSha256=$jre.binary.package.checksum;javaExecutable=$java;engineDirectory=$ltRoot;runtimeRoot=$runtime;nodeExecutable=(Get-Command node -ErrorAction Stop).Source}
$manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtime 'runtime-manifest.json') -Encoding utf8
$tokenPath=Join-Path $runtime 'gateway-token.txt'
if(!(Test-Path -LiteralPath $tokenPath)){[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)) | Set-Content -LiteralPath $tokenPath -NoNewline -Encoding ascii}
'maxTextLength=12000','maxCheckThreads=2','cacheSize=200','maxCheckTimeMillis=15000' | Set-Content -LiteralPath (Join-Path $runtime 'server.properties') -Encoding ascii
Write-Output "Installed runtime outside OneDrive: $runtime"
Write-Output 'No public listener or Windows autostart was enabled. Gateway token stays in the runtime directory and is not printed.'
