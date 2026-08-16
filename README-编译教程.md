# CH572D HID_Mouse 编译与烧录教程

本教程说明如何在 **VS Code** 中编译和烧录 CH572D 的 HID_Mouse 官方例程，无需使用 MounRiver Studio 2 的图形界面。

## 一、背景说明

这个项目是 WCH（沁恒）CH572D 的官方 BLE HID 鼠标例程，原本是 **MounRiver Studio (MRS)** 项目。项目自带完整的 `Makefile` 构建系统（位于 `obj/` 目录），因此我们可以**直接用命令行调用 MRS 自带的工具链编译**，完全绕开 MRS 图形界面。

> **为什么之前 EIDE 编译不通过？**
> 项目里的 `.eide/eide.yml` 配置是残缺的（工具链路径为 `null`、链接脚本为 `undefined.lds`、源文件列表为空），EIDE 无法正确识别这个 MRS 项目。所以最可靠的方式是直接用 MRS 自带的 `make` + 工具链编译。

## 二、所需工具（MRS 自带，无需额外安装）

| 工具 | 路径 |
|------|------|
| RISC-V 编译器 | `D:\MounRiver\MounRiver_Studio2\resources\app\resources\win32\components\WCH\Toolchain\RISC-V Embedded GCC12\bin` |
| make | `D:\MounRiver\MounRiver_Studio2\resources\app\resources\win32\others\Build_Tools\Make\bin` |
| OpenOCD（烧录） | `D:\MounRiver\MounRiver_Studio2\resources\app\resources\win32\components\WCH\OpenOCD\OpenOCD\bin` |

> 如果你的 MRS 安装在其他位置，请修改脚本开头的 `$MRS_HOME` 变量。

## 三、一键编译（推荐）

我已在项目根目录创建了 **`build.ps1`** 脚本，双击或在终端运行即可编译：

```powershell
# 在项目根目录 (e:\Arm_Project\CH572\HID_Mouse) 打开终端，运行：
.\build.ps1
```

> **注意**：如果提示"禁止运行脚本"，请用以下命令（PowerShell 默认安全策略会阻止运行 .ps1）：
> ```powershell
> powershell -ExecutionPolicy Bypass -File .\build.ps1
> ```
> 或者先执行一次 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 永久放开。

编译成功后，会在 `obj/` 目录生成：
- `HID_Mouse.elf` — ELF 固件（用于调试/烧录）
- `HID_Mouse.hex` — HEX 固件（用于 ISP 烧录）

**编译输出示例：**
```
Memory region         Used Size  Region Size  %age Used
           FLASH:       93888 B       240 KB     38.20%
             RAM:        9448 B        12 KB     76.89%
riscv-wch-elf-size --format=berkeley "HID_Mouse.elf"
   text    data     bss     dec     hex filename
  93080     808    4776   98664   18168 HID_Mouse.elf
```

## 四、一键烧录（通过 WCH-Link）

我已在项目根目录创建了 **`flash.ps1`** 脚本，通过 **WCH-Link 调试器** + OpenOCD 烧录：

```powershell
.\flash.ps1
```

**前提条件：**
1. 已安装 WCH-Link 驱动
2. WCH-Link 已通过 USB 连接电脑
3. 芯片已通过 SWD 引脚（SWDIO/SWCLK/GND/3V3）连接到 WCH-Link

> **注意**：CH572 是 BLE 芯片，如果使用串口 ISP 烧录（而非 WCH-Link），请使用 WCH 官方的 **WCHISPTool** 工具，选择生成的 `HID_Mouse.hex` 文件烧录。

## 五、手动命令行编译（进阶）

如果你不想用脚本，也可以手动执行：

```powershell
# 1. 设置工具链环境变量（一次性）
$env:PATH = "D:\MounRiver\MounRiver_Studio2\resources\app\resources\win32\components\WCH\Toolchain\RISC-V Embedded GCC12\bin;" + $env:PATH

# 2. 进入 obj 目录
cd e:\Arm_Project\CH572\HID_Mouse\obj

# 3. 编译
& "D:\MounRiver\MounRiver_Studio2\resources\app\resources\win32\others\Build_Tools\Make\bin\make.exe" all

# 4. 清理（可选）
& "D:\MounRiver\MounRiver_Studio2\resources\app\resources\win32\others\Build_Tools\Make\bin\make.exe" clean
```

## 六、在 VS Code 中一键编译（已配置好）

我已在 `.vscode/tasks.json` 中配置好了任务，你可以在 VS Code 中：

1. 按 **`Ctrl+Shift+B`** → 选择 **"build (MRS 工具链)"** 即可编译
2. 按 **`Ctrl+Shift+P`** → 输入 **"Tasks: Run Task"** → 选择 **"flash (WCH-Link)"** 即可烧录

> 原有的 EIDE 任务（`build (EIDE)` 等）因项目配置残缺无法使用，已保留但非默认。

## 七、常见问题

### Q1: 提示 "未找到 RISC-V 工具链"
检查 `build.ps1` 开头的 `$MRS_HOME` 是否指向正确的 MRS 安装目录。

### Q2: 编译报错 "riscv-wch-elf-gcc: command not found"
说明工具链没加入 PATH。确认 `build.ps1` 中的 `$TOOLCHAIN_BIN` 路径正确，且该目录下有 `riscv-wch-elf-gcc.exe`。

### Q3: 烧录失败
- 确认 WCH-Link 驱动已安装
- 确认芯片供电正常
- 确认 SWD 接线正确（SWDIO、SWCLK、GND、3V3）
- 尝试重新插拔 WCH-Link

### Q4: 修改了代码后如何重新编译？
直接再次运行 `.\build.ps1` 即可，make 会自动检测变更的文件并增量编译。

### Q5: 如何彻底重新编译？
先运行 `.\build.ps1` 前手动执行 `make clean`，或删除 `obj/` 下的 `.o` 和 `.d` 文件。

## 八、项目结构速览

```
HID_Mouse/
├── APP/                  # 应用层（主程序）
│   ├── hidmouse_main.c   # 主函数
│   └── hidmouse.c
├── Profile/              # BLE GATT 服务
│   ├── hidmouseservice.c # HID 鼠标服务
│   ├── hiddev.c
│   └── ...
├── obj/                  # 构建目录（makefile 在此）
│   ├── makefile          # 主 makefile
│   ├── Ld/Link.ld        # 链接脚本
│   ├── LIB/              # BLE 静态库
│   ├── Startup/          # 启动文件
│   ├── StdPeriphDriver/  # 外设驱动
│   └── RVMSIS/           # 内核头文件
├── build.ps1             # 一键编译脚本（本教程新增）
├── flash.ps1             # 一键烧录脚本（本教程新增）
└── HID_Mouse.wvproj      # MRS 项目文件
```