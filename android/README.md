# 构建安卓原版

本目录包含原版安卓安装包的 `MainActivity.java`、清单和启动图标资源。游戏文件来自仓库中的 `dist/`。WebView 在手机本机加载打进 APK 的游戏，存档保存在该应用的数据目录。

在 Windows 上准备 PowerShell 7、JDK 17、Android SDK Platform 35 和 Android SDK Build Tools 35.0.0。将 `JAVA_HOME` 和 `ANDROID_HOME` 分别指向 JDK 和 SDK 的安装目录，然后在仓库根目录运行以下命令。

```powershell
pwsh -File ./android/build.ps1
```

脚本会输出临时目录中已对齐的未签名 APK 路径。用自己的签名密钥安装或分发自行构建的版本。以下命令会由 Android 工具提示输入密钥密码。

```powershell
$unsignedApk = Read-Host '粘贴上一步输出的 APK 完整路径'
& "$env:ANDROID_HOME/build-tools/35.0.0/apksigner.bat" sign --ks my-release.jks --out naiwa.apk $unsignedApk
```

标准 SDK 使用上面的环境变量即可。分别存放工具和平台文件时，可以用脚本的 `-BuildToolsDir` 和 `-AndroidJar` 参数指定位置。安卓外壳及本构建脚本适用 [GPL-3.0-only](../LICENSE)。启动图标按仓库首页的[素材说明](../README.md#开源许可)使用。
