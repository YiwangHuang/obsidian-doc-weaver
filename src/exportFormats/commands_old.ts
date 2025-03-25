import { Command, Notice } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import * as placeholders from '../lib/constant';
import { convertMDtoQMD } from './textConvertUtils/mainConvert';
import type MyPlugin from '../../main';
import { ExportFormatsSettings, exportFormatsSetting } from './settings';

/**
 * 递归查找并复制文件，保持原有目录结构
 */
function copyFilesRecursively(
    sourceDir: string, 
    targetDir: string, 
    fileFilter: (fileName: string) => boolean = () => true
): void {
    const files = fs.readdirSync(sourceDir, { withFileTypes: true });
    
    for (const file of files) {
        const sourcePath = path.join(sourceDir, file.name);
        const targetPath = path.join(targetDir, file.name);

        if (file.isDirectory()) {
            copyFilesRecursively(sourcePath, targetPath, fileFilter);
        } else if (fileFilter(file.name)) {
            if (!fs.existsSync(path.dirname(targetPath))) {
                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            }
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

/**
 * 合并YAML内容到文件
 */
function mergeYamlToFile(filePath: string, yamlContent: string): void {
    const content = fs.readFileSync(filePath, 'utf8');
    const yamlRegex = /^---\n([\s\S]*?)\n---\n/;
    const hasYaml = yamlRegex.test(content);
    
    let newContent: string;
    if (hasYaml) {
        newContent = content.replace(yamlRegex, `---\n${yamlContent}\n---\n`);
    } else {
        newContent = `---\n${yamlContent}\n---\n${content}`;
    }
    
    fs.writeFileSync(filePath, newContent);
}

export function exportFormatsCommand(plugin: MyPlugin): Command {
    return {
        id: 'export-formats',
        name: 'Export Formats',
        callback: async () => exportToFormats(plugin)
    };
}

/**
 * 导出文件到所有启用的格式
 */
async function exportToFormats(plugin: MyPlugin): Promise<void> {
    const targetFile = plugin.app.workspace.getActiveFile();
    if (!targetFile) {
        new Notice('No active file, please select a file first.');
        return;
    }

    const STYLES_ABS_PATH : string = path.join(
        plugin.VAULT_ABS_PATH, 
        plugin.manifest.dir || '', 
        'assets',
        'styles'
    );

    // 获取目标文件信息
    const targetFileRelPath : string = targetFile.path;
    const targetFileName : string = path.parse(targetFileRelPath).name;
    const targetFileAbsPath : string = plugin.getPathAbs(targetFile.path);
    const targetFileDirAbsPath : string = path.dirname(targetFileAbsPath);

    // 获取并处理文件内容
    const content : string = await plugin.app.vault.read(targetFile);
    const processedContent : string = convertMDtoQMD(content);

    // 获取设置
    const settings = plugin.settingList[exportFormatsSetting.name] as ExportFormatsSettings;

    // 只处理被启用的格式
    const enabledFormats = settings.formats.filter(format => format.enabled);

    for (const format of enabledFormats) {
        // 确定目标路径
        const targetAbsPath = placeholders.replaceDatePlaceholders(
            format.path
            .replace(placeholders.VAR_VAULT_DIR, plugin.VAULT_ABS_PATH)
            .replace(placeholders.VAR_NOTE_DIR, targetFileDirAbsPath)
            .replace(placeholders.VAR_NOTE_NAME, targetFileName)
        );

        // 创建目标目录
        if (!fs.existsSync(targetAbsPath)) {
            fs.mkdirSync(targetAbsPath, { recursive: true });
        } else {
            // 如果目录已存在，清空它
            fs.rmSync(targetAbsPath, { recursive: true, force: true });
            fs.mkdirSync(targetAbsPath, { recursive: true });
        }

        // 复制相关文件到目标目录
        copyFilesRecursively(
            targetFileDirAbsPath, 
            targetAbsPath, 
            fileName => fileName.startsWith(targetFileName) && fileName !== targetFile.name
        );

        // 处理主文件
        const targetQmdPath = path.join(targetAbsPath, `${targetFileName}.qmd`);
        fs.writeFileSync(targetQmdPath, processedContent);

        // 处理 YAML 配置
        const yamlContent = placeholders.replaceDatePlaceholders(
            format.yamlConfig
            .replace(placeholders.VAR_VAULT_DIR, plugin.VAULT_ABS_PATH)
            .replace(placeholders.VAR_NOTE_DIR, targetFileDirAbsPath)
            .replace(placeholders.VAR_NOTE_NAME, targetFileName)
        );

        if (yamlContent.trim()) {
            mergeYamlToFile(targetQmdPath, yamlContent);
        }

        // 处理样式文件
        const stylesPath = path.join(STYLES_ABS_PATH, format.id);
        if (fs.existsSync(stylesPath)) {
            copyFilesRecursively(stylesPath, targetAbsPath);
        }
    }

    console.log(`Files processed and distributed to specified paths for formats: ${enabledFormats.map(f => f.name).join(', ')}`);
} 