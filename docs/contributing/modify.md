如果你要把客户端作为独立应用 **tsclaw** 发布，当前项目需要改以下几组。**没有统一的品牌配置文件，部分名称写在代码和安装脚本里。**

**1. 应用名称和标识**

在 [electron-builder.yml](/D:/code/Aion/AionUi/packages/desktop/electron-builder.yml:1) 中修改：

```yaml
appId: com.tsclaw.app   # 示例，按你的应用标识确定
productName: tsclaw
executableName: tsclaw
copyright: Copyright © 2026 tsclaw

protocols:
  - name: tsclaw Protocol
    schemes:
      - tsclaw
```

还需要同步：

| 文件 | 修改内容 |
|---|---|
| [package.json](/D:/code/Aion/AionUi/package.json:2) | `name`、`productName`、`description`、作者信息 |
| [windowsAppUserModelId.ts](/D:/code/Aion/AionUi/packages/desktop/src/process/startup/windowsAppUserModelId.ts:19) | `WINDOWS_APP_USER_MODEL_ID` 与新 `appId` 一致 |
| [deepLink.ts](/D:/code/Aion/AionUi/packages/desktop/src/process/utils/deepLink.ts:10) | `PROTOCOL_SCHEME` 改成 `tsclaw` |
| [platform/index.ts](/D:/code/Aion/AionUi/packages/desktop/src/common/platform/index.ts:11) | 开发版名称改成 `tsclaw-Dev`、`tsclaw-Dev-2` |

打包配置中的快捷方式名称已经引用 `${productName}`，会跟随修改。若发布 Linux，还要修改其中 `maintainer`、`vendor`、`desktop.entry.Name`、`Icon` 和 `MimeType`。

**2. Windows 构建和安装脚本——必须同步**

改了 `executableName` 后，下面这些写死的 **`AionUi.exe` 必须改为 `tsclaw.exe`**：

- [build-with-builder.js](/D:/code/Aion/AionUi/scripts/build-with-builder.js:847)：进程检测、结束进程、构建产物检查。
- [installer-observability.nsh](/D:/code/Aion/AionUi/resources/windows/installer-observability.nsh:4)：应用 EXE 名称及解压检查。
- [installer-update-verify.nsh](/D:/code/Aion/AionUi/resources/windows/installer-update-verify.nsh:173)：安装文件完整性检查。
- [installer-messages.nsh](/D:/code/Aion/AionUi/resources/windows/installer-messages.nsh:4)：安装器里的品牌文案。

否则安装器可能把正常的 `tsclaw.exe` 判定为缺失。若使用版本批量打包脚本，也要同步它们的产物文件名。

**3. 图标和界面品牌**

替换这些图片，文件名可以继续保留：

```text
resources/app.ico       Windows 图标
resources/app.png       托盘、通知、Linux 图标
resources/app.icns      macOS 图标
resources/app_dev.png   开发图标

packages/desktop/src/renderer/assets/logos/brand/favicon.ico
packages/desktop/src/renderer/assets/logos/brand/app.png

public/pwa/icon-192.png
public/pwa/icon-512.png
public/pwa/icon-180.png
```

文字还需修改：

- [index.html](/D:/code/Aion/AionUi/packages/desktop/src/renderer/index.html:6)：网页标题、应用名称。
- [DocumentTitle.tsx](/D:/code/Aion/AionUi/packages/desktop/src/renderer/components/layout/DocumentTitle.tsx:21)：运行时网页标题。
- [Titlebar/index.tsx](/D:/code/Aion/AionUi/packages/desktop/src/renderer/components/layout/Titlebar/index.tsx:101)：窗口标题。
- [manifest.webmanifest](/D:/code/Aion/AionUi/public/manifest.webmanifest:2)：PWA 名称和描述。
- `packages/desktop/src/renderer/services/i18n/locales/`：各语言中的登录品牌、关于、设置等文案。
- [AboutModalContent.tsx](/D:/code/Aion/AionUi/packages/desktop/src/renderer/components/settings/SettingsModal/contents/AboutModalContent.tsx:115)：官网、仓库、帮助和下载链接。

快速打包命令里的 `signAndEditExecutable=false` 需要移除，否则自定义 EXE 图标不会写入。

**4. 默认存储目录**

正式版数据根目录跟随 Electron 应用名称，名称同步后通常变为：

```text
%APPDATA%\tsclaw\
```

但内部数据子目录仍写死为 `aionui`。如果希望完整路径为：

```text
%APPDATA%\tsclaw\tsclaw\
```

需要修改 [utils.ts](/D:/code/Aion/AionUi/packages/desktop/src/process/utils/utils.ts:98) 的 `getDataPath()`；macOS 的 `.aionui`、`.aionui-config` 别名也在这里。

**改变目录不会自动迁移旧聊天记录和配置**，需要另外处理旧数据迁移。

**5. 自动更新——独立发布时必须处理**

| 文件 | 修改内容 |
|---|---|
| [electron-builder.yml](/D:/code/Aion/AionUi/packages/desktop/electron-builder.yml:219) | `publish.owner`、`publish.repo` |
| [updateFeed.ts](/D:/code/Aion/AionUi/packages/desktop/src/process/services/updateFeed.ts:10) | 更新 CDN 地址 |
| [updateBridge.ts](/D:/code/Aion/AionUi/packages/desktop/src/process/bridge/updateBridge.ts:63) | GitHub 仓库、CDN 域名和下载域名白名单 |
| [autoUpdaterService.ts](/D:/code/Aion/AionUi/packages/desktop/src/process/services/autoUpdaterService.ts:201) | 开发更新缓存中的应用 ID |

仅修改 `publish` 不够，运行时还会使用代码里的旧更新地址。没有自己的发布服务时，应先关闭自动更新入口，避免 tsclaw 下载原版 AionUi。

**6. 按发布范围处理**

- 发布手机端：修改 [mobile/app.config.ts](/D:/code/Aion/AionUi/mobile/app.config.ts:8) 的名称、图标、协议、iOS/Android 包名和 EAS 项目。
- 发布独立 Web CLI：同步 `packages/web-cli/src/index.ts`、`scripts/pack-web-cli.js` 中的 `aionui-web` 和默认目录。
- 使用错误上报：配置自己的 `SENTRY_DSN`，检查安装器的上报配置。

**不建议全项目直接替换 `aionui`。** `@aionui/*` 内部包名、`AIONUI_*` 后端环境变量、数据库文件名和通信标记可以保留；这些涉及前后端协议或数据兼容，不是客户端改名的必要项。