# MRS Tools (CH572 Build & Flash)

在 VS Code 中一键编译和烧录 CH572D 项目（使用 MounRiver Studio 工具链）。

## 功能

- **状态栏按钮**：编译、烧录、选择调试器
- **右键菜单**：在资源管理器右键菜单中编译/烧录
- **多调试器支持**：WCH-Link、SEGGER J-Link
- **可移植工具链**：优先使用工作区 `tools/` 目录内的工具链，无需安装 MounRiver Studio

## 工具链打包

工具链已打包到工作区 `tools/` 目录（约 1GB），实现完全可移植：

```
tools/
├── gcc/       # RISC-V GCC 工具链（riscv-wch-elf-*）
├── make/      # make 构建工具
└── openocd/   # OpenOCD 烧录工具
```

工具链解析顺序：
1. **优先**使用工作区 `tools/` 目录
2. **回退**到 `mrsTools.mrsHome` 指定的 MounRiver Studio 安装目录

> 注意：`tools/` 目录已加入 `.gitignore`，不纳入版本控制。若需在另一台机器使用，请复制整个 `tools/` 目录或安装 MounRiver Studio。

## 使用

1. 打开 CH572D 项目工作区
2. 点击状态栏的「编译」按钮或按 `Ctrl+Shift+B`
3. 点击「烧录」按钮烧录固件

## 配置

在 VS Code 设置中搜索 `mrsTools`：

- `mrsTools.mrsHome`：MounRiver Studio 2 安装目录（仅当工作区 tools 不存在时作为回退）
- `mrsTools.debugger`：烧录调试器（wchlink / jlink）