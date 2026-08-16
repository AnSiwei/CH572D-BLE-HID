# ============================================================
#  HID_Mouse 一键编译脚本 (CH572D)
#  使用 MounRiver Studio 2 自带的 RISC-V 工具链
# ============================================================

# ---------- 可配置项 ----------
# MounRiver Studio 2 安装目录（作为回退，当工作区 tools 不存在时使用）
$MRS_HOME = "D:\MounRiver\MounRiver_Studio2"

# 工作区 tools 目录（优先使用，实现可移植）
$TOOLS_DIR = Join-Path $PSScriptRoot "tools"

# RISC-V 工具链目录（含 riscv-wch-elf-gcc.exe）
$TOOLCHAIN_BIN = Join-Path $TOOLS_DIR "gcc\bin"

# make 工具目录（含 make.exe）
$MAKE_BIN = Join-Path $TOOLS_DIR "make"

# 项目 obj 目录（makefile 所在位置）
$OBJ_DIR = Join-Path $PSScriptRoot "obj"
# ------------------------------

# 若工作区 tools 不存在，回退到 MRS 安装目录
if (-not (Test-Path "$TOOLCHAIN_BIN\riscv-wch-elf-gcc.exe")) {
    $TOOLCHAIN_BIN = "$MRS_HOME\resources\app\resources\win32\components\WCH\Toolchain\RISC-V Embedded GCC12\bin"
    $MAKE_BIN = "$MRS_HOME\resources\app\resources\win32\others\Build_Tools\Make\bin"
}

# 检查工具链是否存在
if (-not (Test-Path "$TOOLCHAIN_BIN\riscv-wch-elf-gcc.exe")) {
    Write-Host "[错误] 未找到 RISC-V 工具链: $TOOLCHAIN_BIN" -ForegroundColor Red
    Write-Host "请检查工作区 tools 目录或 MRS_HOME 路径是否正确。" -ForegroundColor Yellow
    exit 1
}
if (-not (Test-Path "$MAKE_BIN\make.exe")) {
    Write-Host "[错误] 未找到 make 工具: $MAKE_BIN" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "$OBJ_DIR\makefile")) {
    Write-Host "[错误] 未找到 makefile: $OBJ_DIR\makefile" -ForegroundColor Red
    exit 1
}

# 将工具链加入 PATH（make 内部会调用 riscv-wch-elf-gcc）
$oldPath = [Environment]::GetEnvironmentVariable("PATH", "Process")
[Environment]::SetEnvironmentVariable("PATH", "$TOOLCHAIN_BIN;$MAKE_BIN;$oldPath", "Process")

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  HID_Mouse 编译 (CH572D)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "工具链: $TOOLCHAIN_BIN" -ForegroundColor Gray
Write-Host ""

# 切换到 obj 目录并执行 make
Push-Location $OBJ_DIR
try {
    & "$MAKE_BIN\make.exe" all
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "  编译成功！" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    $elf = Join-Path $OBJ_DIR "HID_Mouse.elf"
    $hex = Join-Path $OBJ_DIR "HID_Mouse.hex"
    if (Test-Path $elf) {
        $size = (Get-Item $elf).Length
        Write-Host "ELF: $elf ($([math]::Round($size/1024,1)) KB)" -ForegroundColor Green
    }
    if (Test-Path $hex) {
        Write-Host "HEX: $hex" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "烧录命令: .\flash.ps1" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "编译失败，退出码: $exitCode" -ForegroundColor Red
}
exit $exitCode