# ============================================================
#  HID_Mouse 一键烧录脚本 (CH572D)
#  支持 WCH-Link 和 SEGGER J-Link 调试器
#  用法:
#    .\flash.ps1                    # 使用默认调试器 (WCH-Link)
#    .\flash.ps1 -Debugger jlink    # 使用 J-Link
#    .\flash.ps1 -Debugger wchlink  # 使用 WCH-Link
# ============================================================

param(
    [ValidateSet("wchlink", "jlink")]
    [string]$Debugger = "wchlink"
)

# ---------- 可配置项 ----------
# MounRiver Studio 2 安装目录（作为回退，当工作区 tools 不存在时使用）
$MRS_HOME = "D:\MounRiver\MounRiver_Studio2"

# 工作区 tools 目录（优先使用，实现可移植）
$TOOLS_DIR = Join-Path $PSScriptRoot "tools"

# OpenOCD 目录（含 openocd.exe）
$OPENOCD_BIN = Join-Path $TOOLS_DIR "openocd"

# 调试器配置文件目录（本扩展目录下的 openocd 文件夹）
$CFG_DIR = Join-Path $PSScriptRoot ".vscode\mrs-tools\openocd"

# 要烧录的固件（ELF 或 HEX）
$FIRMWARE = Join-Path $PSScriptRoot "obj\HID_Mouse.elf"
# ------------------------------

# 若工作区 tools 不存在，回退到 MRS 安装目录
if (-not (Test-Path "$OPENOCD_BIN\openocd.exe")) {
    $OPENOCD_BIN = "$MRS_HOME\resources\app\resources\win32\components\WCH\OpenOCD\OpenOCD\bin"
}

# 根据调试器选择配置文件
switch ($Debugger) {
    "wchlink" {
        $CFG_FILE = Join-Path $CFG_DIR "wchlink-ch572.cfg"
        $DEBUGGER_NAME = "WCH-Link"
    }
    "jlink" {
        $CFG_FILE = Join-Path $CFG_DIR "jlink-ch572.cfg"
        $DEBUGGER_NAME = "SEGGER J-Link"
    }
}

# 检查工具是否存在
if (-not (Test-Path "$OPENOCD_BIN\openocd.exe")) {
    Write-Host "[错误] 未找到 openocd.exe: $OPENOCD_BIN" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $CFG_FILE)) {
    Write-Host "[错误] 未找到调试器配置: $CFG_FILE" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $FIRMWARE)) {
    Write-Host "[错误] 未找到固件文件: $FIRMWARE" -ForegroundColor Red
    Write-Host "请先运行 .\build.ps1 编译。" -ForegroundColor Yellow
    exit 1
}

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  HID_Mouse 烧录 (CH572D)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "调试器: $DEBUGGER_NAME" -ForegroundColor Gray
Write-Host "固件:   $FIRMWARE" -ForegroundColor Gray
Write-Host "请确保调试器已连接并识别到芯片..." -ForegroundColor Yellow
Write-Host ""

# 通过 OpenOCD 烧录固件
# program 命令: 烧录 + 校验 + 复位 + 退出
& "$OPENOCD_BIN\openocd.exe" `
    -f "$CFG_FILE" `
    -c "program $FIRMWARE verify reset exit"

$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "  烧录成功！" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "烧录失败，退出码: $exitCode" -ForegroundColor Red
    Write-Host "请检查:" -ForegroundColor Yellow
    Write-Host "  1. $DEBUGGER_NAME 是否已插入 USB" -ForegroundColor Yellow
    Write-Host "  2. 芯片是否已连接（SWD 引脚）" -ForegroundColor Yellow
    Write-Host "  3. 驱动是否安装" -ForegroundColor Yellow
    if ($Debugger -eq "jlink") {
        Write-Host "  4. J-Link 固件是否支持 RISC-V（需 V9.4+）" -ForegroundColor Yellow
    }
}
exit $exitCode