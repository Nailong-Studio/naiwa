# SPDX-License-Identifier: GPL-3.0-only
#Requires -Version 7.0
param(
    [string]$BuildToolsDir,
    [string]$AndroidJar,
    [string]$JdkHome = $env:JAVA_HOME
)

$ErrorActionPreference = 'Stop'
$sdk = $env:ANDROID_HOME
if (!$sdk) { $sdk = $env:ANDROID_SDK_ROOT }
if (!$BuildToolsDir -and $sdk) { $BuildToolsDir = Join-Path $sdk 'build-tools/35.0.0' }
if (!$AndroidJar -and $sdk) { $AndroidJar = Join-Path $sdk 'platforms/android-35/android.jar' }
if (!$BuildToolsDir -or !$AndroidJar -or !$JdkHome) {
    throw 'Set JAVA_HOME and ANDROID_HOME, or pass -JdkHome, -BuildToolsDir and -AndroidJar.'
}
$BuildToolsDir = (Resolve-Path -LiteralPath $BuildToolsDir).Path
$AndroidJar = (Resolve-Path -LiteralPath $AndroidJar).Path
$JdkHome = (Resolve-Path -LiteralPath $JdkHome).Path
$aapt = Join-Path $BuildToolsDir 'aapt.exe'
$zipalign = Join-Path $BuildToolsDir 'zipalign.exe'
$d8 = Join-Path $BuildToolsDir 'lib/d8.jar'
$java = Join-Path $JdkHome 'bin/java.exe'
$javac = Join-Path $JdkHome 'bin/javac.exe'
foreach ($file in $aapt, $zipalign, $d8, $java, $javac) {
    if (!(Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing tool: $file" }
}
function Invoke-BuildTool([string]$Tool, [string[]]$Arguments) {
    & $Tool @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Tool exited with status $LASTEXITCODE" }
}

$work = Join-Path ([IO.Path]::GetTempPath()) ('naiwa-android-' + [Guid]::NewGuid().ToString('N'))
$assets = Join-Path $work 'assets'
$classes = Join-Path $work 'classes'
$dex = Join-Path $work 'dex'
foreach ($dir in $assets, $classes, $dex) { [IO.Directory]::CreateDirectory($dir) | Out-Null }
$game = Join-Path $assets 'game'
$dist = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../dist')).Path
foreach ($source in (Get-ChildItem -LiteralPath $dist -Recurse -File)) {
    if ($source.Extension -eq '.png' -and (Test-Path -LiteralPath ([IO.Path]::ChangeExtension($source.FullName, '.webp')))) { continue }
    $dest = Join-Path $game ([IO.Path]::GetRelativePath($dist, $source.FullName))
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($dest)) | Out-Null
    [IO.File]::Copy($source.FullName, $dest)
}
$baseApk = Join-Path $work 'package.apk'
$output = Join-Path $work 'naiwa-unsigned.apk'
Invoke-BuildTool $aapt @('package','-f','-M', (Join-Path $PSScriptRoot 'AndroidManifest.xml'), '-S',(Join-Path $PSScriptRoot 'res'),'-A',$assets,'-I',$AndroidJar,'-F',$baseApk)
$sources = @(Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'src') -Filter '*.java' -Recurse -File | ForEach-Object FullName)
Invoke-BuildTool $javac (@('-encoding','UTF-8','-source','8','-target','8','-classpath',$AndroidJar,'-d',$classes) + $sources)
$bytecode = @(Get-ChildItem -LiteralPath $classes -Filter '*.class' -Recurse -File | ForEach-Object FullName)
Invoke-BuildTool $java (@('-cp',$d8,'com.android.tools.r8.D8','--lib',$AndroidJar,'--min-api','26','--output',$dex) + $bytecode)
Push-Location $dex
try { Invoke-BuildTool $aapt @('add',$baseApk,'classes.dex') } finally { Pop-Location }
Invoke-BuildTool $zipalign @('-f','4',$baseApk,$output)
Invoke-BuildTool $zipalign @('-c','4',$output)
Write-Output $output
