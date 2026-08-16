// MRS Tools 扩展 - CH572D 编译与烧录
const vscode = require('vscode');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// 工具链相对路径（相对于 MRS_HOME，作为回退）
const TOOLCHAIN_REL = 'resources\\app\\resources\\win32\\components\\WCH\\Toolchain\\RISC-V Embedded GCC12\\bin';
const MAKE_REL = 'resources\\app\\resources\\win32\\others\\Build_Tools\\Make\\bin';
const OPENOCD_REL = 'resources\\app\\resources\\win32\\components\\WCH\\OpenOCD\\OpenOCD\\bin';

let statusBarBuild = null;
let statusBarFlash = null;
let statusBarDebugger = null;

/** 获取 MRS 安装目录 */
function getMrsHome() {
    const cfg = vscode.workspace.getConfiguration('mrsTools');
    return cfg.get('mrsHome', 'D:\\MounRiver\\MounRiver_Studio2');
}

/** 获取工作区 tools 目录（优先使用，实现可移植） */
function getToolsDir() {
    const root = getWorkspaceRoot();
    return root ? path.join(root, 'tools') : null;
}

/** 解析工具链 bin 目录：优先工作区 tools，回退到 MRS */
function getToolchainBin() {
    const toolsDir = getToolsDir();
    if (toolsDir) {
        const local = path.join(toolsDir, 'gcc', 'bin');
        if (fs.existsSync(path.join(local, 'riscv-wch-elf-gcc.exe'))) {
            return local;
        }
    }
    return path.join(getMrsHome(), TOOLCHAIN_REL);
}

/** 解析 make 目录：优先工作区 tools，回退到 MRS */
function getMakeBin() {
    const toolsDir = getToolsDir();
    if (toolsDir) {
        const local = path.join(toolsDir, 'make');
        if (fs.existsSync(path.join(local, 'make.exe'))) {
            return local;
        }
    }
    return path.join(getMrsHome(), MAKE_REL);
}

/** 解析 OpenOCD 目录：优先工作区 tools，回退到 MRS */
function getOpenocdBin() {
    const toolsDir = getToolsDir();
    if (toolsDir) {
        const local = path.join(toolsDir, 'openocd');
        if (fs.existsSync(path.join(local, 'openocd.exe'))) {
            return local;
        }
    }
    return path.join(getMrsHome(), OPENOCD_REL);
}

/** 获取当前调试器 */
function getDebugger() {
    const cfg = vscode.workspace.getConfiguration('mrsTools');
    return cfg.get('debugger', 'wchlink');
}

/** 获取工作区根目录 */
function getWorkspaceRoot() {
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
        return folders[0].uri.fsPath;
    }
    return null;
}

/** 执行命令并输出到终端 */
function runCommand(cmd, args, cwd, terminalName) {
    return new Promise((resolve) => {
        const terminal = vscode.window.createTerminal({
            name: terminalName,
            cwd: cwd
        });
        terminal.show(true);
        // 构造命令字符串（含 PATH 设置）
        const toolchainBin = getToolchainBin();
        const makeBin = getMakeBin();
        const envPath = `${toolchainBin};${makeBin};${process.env.PATH}`;
        const cmdStr = `$env:PATH = "${envPath}"; & "${cmd}" ${args.join(' ')}`;
        terminal.sendText(cmdStr);
        // 等待命令完成（简单轮询终端是否关闭）
        setTimeout(() => resolve(0), 500);
    });
}

/** 编译 */
async function build() {
    const root = getWorkspaceRoot();
    if (!root) {
        vscode.window.showErrorMessage('未找到工作区文件夹');
        return;
    }
    const makeBin = path.join(getMakeBin(), 'make.exe');
    const objDir = path.join(root, 'obj');
    if (!fs.existsSync(makeBin)) {
        vscode.window.showErrorMessage(`未找到 make.exe: ${makeBin}`);
        return;
    }
    if (!fs.existsSync(path.join(objDir, 'makefile'))) {
        vscode.window.showErrorMessage(`未找到 makefile: ${objDir}`);
        return;
    }
    vscode.window.showInformationMessage('MRS: 开始编译...');
    await runCommand(makeBin, ['all'], objDir, 'MRS Build');
}

/** 烧录 */
async function flash() {
    const root = getWorkspaceRoot();
    if (!root) {
        vscode.window.showErrorMessage('未找到工作区文件夹');
        return;
    }
    const openocdBin = path.join(getOpenocdBin(), 'openocd.exe');
    const firmware = path.join(root, 'obj', 'HID_Mouse.elf');
    if (!fs.existsSync(openocdBin)) {
        vscode.window.showErrorMessage(`未找到 openocd.exe: ${openocdBin}`);
        return;
    }
    if (!fs.existsSync(firmware)) {
        vscode.window.showErrorMessage(`未找到固件: ${firmware}，请先编译`);
        return;
    }
    const debuggerType = getDebugger();
    const cfgFile = path.join(__dirname, 'openocd', `${debuggerType}-ch572.cfg`);
    if (!fs.existsSync(cfgFile)) {
        vscode.window.showErrorMessage(`未找到调试器配置: ${cfgFile}`);
        return;
    }
    vscode.window.showInformationMessage(`MRS: 开始烧录 (${debuggerType})...`);
    const args = ['-f', cfgFile, '-c', `program ${firmware} verify reset exit`];
    await runCommand(openocdBin, args, root, 'MRS Flash');
}

/** 编译并烧录 */
async function buildAndFlash() {
    await build();
    // 等待编译完成
    await new Promise(r => setTimeout(r, 3000));
    await flash();
}

/** 清理 */
async function clean() {
    const root = getWorkspaceRoot();
    if (!root) {
        vscode.window.showErrorMessage('未找到工作区文件夹');
        return;
    }
    const makeBin = path.join(getMakeBin(), 'make.exe');
    const objDir = path.join(root, 'obj');
    vscode.window.showInformationMessage('MRS: 开始清理...');
    await runCommand(makeBin, ['clean'], objDir, 'MRS Clean');
}

/** 选择调试器 */
async function selectDebugger() {
    const current = getDebugger();
    const choice = await vscode.window.showQuickPick(
        [
            { label: 'WCH-Link', description: 'WCH 官方调试器（推荐）', value: 'wchlink' },
            { label: 'SEGGER J-Link', description: 'J-Link RISC-V 版本', value: 'jlink' }
        ],
        {
            placeHolder: `当前调试器: ${current === 'wchlink' ? 'WCH-Link' : 'J-Link'}`,
            title: '选择烧录调试器'
        }
    );
    if (choice) {
        const cfg = vscode.workspace.getConfiguration('mrsTools');
        await cfg.update('debugger', choice.value, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage(`已选择调试器: ${choice.label}`);
        updateStatusBar();
    }
}

/** 更新状态栏 */
function updateStatusBar() {
    const debuggerType = getDebugger();
    statusBarDebugger.text = `$(debug-alt) ${debuggerType === 'wchlink' ? 'WCH-Link' : 'J-Link'}`;
    statusBarDebugger.tooltip = '点击选择调试器';
}

/** 激活扩展 */
function activate(context) {
    // 注册命令
    const buildCmd = vscode.commands.registerCommand('mrs-tools.build', build);
    const flashCmd = vscode.commands.registerCommand('mrs-tools.flash', flash);
    const buildAndFlashCmd = vscode.commands.registerCommand('mrs-tools.buildAndFlash', buildAndFlash);
    const cleanCmd = vscode.commands.registerCommand('mrs-tools.clean', clean);
    const selectDebuggerCmd = vscode.commands.registerCommand('mrs-tools.selectDebugger', selectDebugger);

    // 创建状态栏按钮
    statusBarBuild = vscode.window.createStatusBarItem('mrs-tools.build', vscode.StatusBarAlignment.Left, 100);
    statusBarBuild.text = '$(tools) 编译';
    statusBarBuild.tooltip = 'MRS: 编译项目';
    statusBarBuild.command = 'mrs-tools.build';
    statusBarBuild.show();

    statusBarFlash = vscode.window.createStatusBarItem('mrs-tools.flash', vscode.StatusBarAlignment.Left, 99);
    statusBarFlash.text = '$(flame) 烧录';
    statusBarFlash.tooltip = 'MRS: 烧录固件';
    statusBarFlash.command = 'mrs-tools.flash';
    statusBarFlash.show();

    statusBarDebugger = vscode.window.createStatusBarItem('mrs-tools.debugger', vscode.StatusBarAlignment.Left, 98);
    statusBarDebugger.command = 'mrs-tools.selectDebugger';
    statusBarDebugger.show();
    updateStatusBar();

    // 添加到订阅
    context.subscriptions.push(
        buildCmd, flashCmd, buildAndFlashCmd, cleanCmd, selectDebuggerCmd,
        statusBarBuild, statusBarFlash, statusBarDebugger
    );
}

function deactivate() {}

module.exports = { activate, deactivate };