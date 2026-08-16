# CH572D BLE HID Mouse

基于 WCH CH572D 的 BLE HID 鼠标示例工程。设备以 BLE 外设角色广播，连接后向主机提供 HID Mouse、Battery 和 Device Information 服务。

项目保留了 MounRiver Studio (MRS) 原始工程文件，并提供 PowerShell 脚本，可在 Windows 上使用命令行完成构建与烧录。

## 功能概览

- CH572D BLE Peripheral HID Mouse 示例
- 默认广播名称：`HID Mouse`
- HID、Battery、Device Information GATT 服务
- TMOS 任务调度
- 支持 WCH-Link 或 SEGGER J-Link 通过 OpenOCD 烧录

## 环境要求

- Windows PowerShell 5.1 或更高版本
- [MounRiver Studio 2](https://www.mounriver.com/)（提供 WCH RISC-V GCC、make 和 OpenOCD）
- 用于烧录时：WCH-Link 或支持 RISC-V 的 SEGGER J-Link，以及对应驱动

为避免将约 1 GB 的本地工具链纳入 Git，`tools/`、`obj/` 和 `build/` 均被 `.gitignore` 排除。脚本按以下顺序查找工具：

1. 工作区内未提交的 `tools/` 目录。
2. `D:\MounRiver\MounRiver_Studio2` 安装目录。

若 MRS 安装在其他位置，请修改 `build.ps1` 和 `flash.ps1` 顶部的 `$MRS_HOME`。

## 构建

在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

也可在 VS Code 中运行默认构建任务 **build (MRS 工具链)**。

构建成功后，固件输出在 `obj/`：

| 文件 | 用途 |
| --- | --- |
| `HID_Mouse.elf` | OpenOCD 烧录和调试 |
| `HID_Mouse.hex` | WCHISPTool 等 ISP 工具烧录 |

## 烧录

先成功构建，再连接调试器、目标板电源及 SWD 信号线。

### WCH-Link

```powershell
powershell -ExecutionPolicy Bypass -File .\flash.ps1
```

### SEGGER J-Link

```powershell
powershell -ExecutionPolicy Bypass -File .\flash.ps1 -Debugger jlink
```

脚本会调用 OpenOCD 对 `obj/HID_Mouse.elf` 执行烧录、校验和复位。若使用串口 ISP，请使用 WCHISPTool 选择生成的 `HID_Mouse.hex`。

## VS Code 任务

| 任务 | 作用 |
| --- | --- |
| `build (MRS 工具链)` | 使用 `build.ps1` 构建 |
| `flash (WCH-Link)` | 使用 `flash.ps1` 通过 WCH-Link 烧录 |
| `build (EIDE)` | 原始 EIDE 构建任务 |

> `.eide/eide.yml` 的工具链、链接脚本和源文件配置不完整。推荐使用 MRS 工具链任务或 `build.ps1`，不要依赖 EIDE 任务构建。

## 项目结构

```text
APP/
  hidmouse_main.c       Application entry point and BLE initialization
  hidmouse.c            HID mouse advertising, pairing and report handling
  include/              Application headers
Profile/                BLE GATT services and HID device implementation
obj/                    Original MRS makefile, linker script, library and drivers
.vscode/                VS Code tasks and local MRS helper configuration
build.ps1               Command-line build script
flash.ps1               OpenOCD flash script
HID_Mouse.wvproj        MRS project file
```

## 常见问题

### 找不到 RISC-V 工具链或 make

确认 MRS 已安装，或在根目录提供正确结构的本地 `tools/`。必要时修改脚本中的 `$MRS_HOME`。

### `flash.ps1` 找不到固件

先运行 `build.ps1`，确保 `obj/HID_Mouse.elf` 已生成。

### WCH-Link 烧录失败

确认 WCH-Link 驱动、目标板供电及 SWDIO、SWCLK、GND 连接。重新插拔调试器后重试。

## 许可证与来源

本工程基于 WCH 提供的 CH572D 示例及 BLE 库。使用、修改和分发时请遵循源文件中的版权声明和 WCH 相关许可条款。