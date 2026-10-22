#requires -Version 7.0
param([string]$RuntimeRoot=(Join-Path $env:LOCALAPPDATA 'LTU\Assessor'),[ValidateSet('8B','14B')][string]$Model='8B')
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath($RuntimeRoot)
if($root.StartsWith([IO.Path]::GetFullPath($env:OneDrive),[StringComparison]::OrdinalIgnoreCase)){throw 'Keep model weights outside OneDrive.'}
New-Item -ItemType Directory -Force -Path $root | Out-Null
$files=@(
 @{name='llama-b11827-bin-win-vulkan-x64.zip';url='https://github.com/ggml-org/llama.cpp/releases/download/b11827/llama-b11827-bin-win-vulkan-x64.zip';sha='760034ee144e5f0ab712abd55e2c46dfe9930fd4f38508eb0f0ec36890074e6d'},
 @{name='Qwen3-8B-Q4_K_M.gguf';url='https://huggingface.co/Qwen/Qwen3-8B-GGUF/resolve/7c41481f57cb95916b40956ab2f0b139b296d974/Qwen3-8B-Q4_K_M.gguf';sha='d98cdcbd03e17ce47681435b5150e34c1417f50b5c0019dd560e4882c5745785'}
)
if($Model -eq '14B'){$files[1]=@{name='Qwen3-14B-Q4_K_M.gguf';url='https://huggingface.co/Qwen/Qwen3-14B-GGUF/resolve/530227a7d994db8eca5ab5ced2fb692b614357fd/Qwen3-14B-Q4_K_M.gguf';sha='500a8806e85ee9c83f3ae08420295592451379b4f8cf2d0f41c15dffeb6b81f0'}}
foreach($file in $files){
 $target=Join-Path $root $file.name
 if(!(Test-Path -LiteralPath $target)){
  & curl.exe --fail --location --retry 3 --output ($target+'.partial') $file.url
  if($LASTEXITCODE -ne 0){throw "Download failed: $($file.name)"}
  if((Get-FileHash -LiteralPath ($target+'.partial') -Algorithm SHA256).Hash.ToLower() -ne $file.sha){throw 'Download checksum mismatch'}
  Move-Item -LiteralPath ($target+'.partial') -Destination $target
 }
 if((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLower() -ne $file.sha){throw 'Existing file checksum mismatch'}
}
$bin=Join-Path $root 'llama-b11827'
if(!(Test-Path -LiteralPath $bin)){Expand-Archive -LiteralPath (Join-Path $root $files[0].name) -DestinationPath $bin}
@{model=('Qwen3-'+$Model+'-Q4_K_M');revision=$(if($Model -eq '14B'){'530227a7d994db8eca5ab5ced2fb692b614357fd'}else{'7c41481f57cb95916b40956ab2f0b139b296d974'});llama='b11827';files=$files} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $root ('runtime-manifest-'+$Model+'.json')) -Encoding utf8
Write-Output 'Verified local assessor installed. No external listener or paid API was enabled.'
