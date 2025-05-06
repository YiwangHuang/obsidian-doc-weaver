import { Setting } from 'obsidian';
import type MyPlugin from '../main';
import { SettingsRegistry } from '../main';
import * as path from 'path';
import * as placeholders from '../lib/constant';
import * as fs from 'fs';
import { OutputFormat } from './textConvert/textConverter';
import * as child_process from 'child_process';
import { generateHexId } from '../lib/commonUtils';

/*
TODO: 需修改，提示词：
现在的逻辑是点击Add New Format按钮，调用相关函数从src/exportFormats/deflautDependency中复制相关内容。能不能在构建项目时直接将src/exportFormats/deflautDependency中的相关内容直接写入main.js文件中，不需要及时去读。要求：
1. 仅修改src/exportFormats/settings.ts
2. 不要直接把src/exportFormats/deflautDependency中的文件写入src/exportFormats/settings.ts，这样修改不方便
3. 先讲思路，经我确认后再改代码
*/

// 类型定义
export interface FormatConfig {
    id: string;           // 格式ID
    format: OutputFormat;// 导出格式
    enabled: boolean;     // 是否启用
    yaml: string;   // YAML配置
    name?: string;         // 格式名称
    path: string;         // 输出路径
    excalidraw_export_type?: 'png' | 'svg'; // excalidraw导出类型
}

export interface ExportFormatsSettings {
    formats: FormatConfig[];
}

// 定义每种格式的默认 YAML 配置
const FORMAT_DEFAULT_CONFIGS: Partial<Record<OutputFormat, string>> = {
    'quarto': 
`---
title: "{{noteName}}"
author: "your name"
date: "{{date: YYYY-MM-DD}}"
format:
  html:
    toc: true
    number-sections: true
    code-fold: true
    theme: cosmo
---`,

    'vuepress':
`---
title: {{noteName}}
author: your name
date: {{date: YYYY-MM-DD}}
categories:
  - your category
tags:
  - your tag
sidebar: auto
---`,

    'typst':
`#import "config.typ": *

#show: doc => conf(
  title: "{{noteName}}",
  author: "Your name",
  doc,
)`
};

// 默认设置
export const DEFAULT_EXPORT_FORMATS_SETTINGS: ExportFormatsSettings = {
    formats: []
};

/**
 * 递归读取目录中的所有文件
 * @param dirPath 目录路径
 * @param baseDir 基础目录（用于生成相对路径）
 * @returns 文件路径和内容的映射对象
 */
function readDirRecursively(dirPath: string, baseDir: string = dirPath): Record<string, string> {
    const files: Record<string, string> = {};
    
    // 读取目录内容
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
            // 递归读取子目录
            const subFiles = readDirRecursively(fullPath, baseDir);
            Object.assign(files, subFiles);
        } else {
            // 读取文件内容
            const relativePath = path.relative(baseDir, fullPath);
            const content = fs.readFileSync(fullPath, 'utf-8');
            files[relativePath] = content;
        }
    }
    
    return files;
}

/**
 * 读取默认依赖文件夹中的文件内容
 * @param plugin 插件实例
 * @returns 每种格式的文件内容映射
 */
function loadDefaultFiles(plugin: MyPlugin): Partial<Record<OutputFormat, Record<string, string>>> {
    const defaultFiles: Partial<Record<OutputFormat, Record<string, string>>> = {
        'quarto': {},
        'vuepress': {},
        'typst': {}
    };
    
    const defaultDependencyPath = path.join(
        plugin.PLUGIN_ABS_PATH,
        'deflautDependency'
    );
    
    // 读取每种格式的文件
    for (const format of Object.keys(defaultFiles) as OutputFormat[]) {
        const formatPath = path.join(defaultDependencyPath, format);
        if (fs.existsSync(formatPath)) {
            defaultFiles[format] = readDirRecursively(formatPath);
        }
    }
    
    return defaultFiles;
}

/**
 * 创建格式的默认文件结构
 * @param basePath 目标路径
 * @param format 格式类型
 * @param plugin 插件实例
 */
function createFormatAssetStructure(basePath: string, format: OutputFormat, plugin: MyPlugin): void {
    const defaultFiles = loadDefaultFiles(plugin);
    const files = defaultFiles[format] || {};
    
    // 创建每个默认文件
    for (const [filePath, content] of Object.entries(files)) {
        const fullPath = path.join(basePath, filePath);
        const dirPath = path.dirname(fullPath);
        
        // 确保目录存在
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // 写入文件内容
        fs.writeFileSync(fullPath, content);
    }
}

/**
 * 渲染格式的详细设置项
 * @param formatContainer 容器元素
 * @param formatConfig 格式配置
 * @param plugin 插件实例
 */
function renderFormatDetailSettings(formatContainer: HTMLElement, formatConfig: FormatConfig, plugin: MyPlugin): void {

    // 格式名称设置
    new Setting(formatContainer)
        .setName('Format Name')
        .setDesc('The name for this configuration')
        .addText(text => text
            .setValue(formatConfig.name || `${formatConfig.format}_${formatConfig.id}`) // 如果name为空，则使用默认名称
            .onChange(async (value) => {
                formatConfig.name = value.trim();
                await plugin.saveData(plugin.settingList);
            }));

    // 输出路径设置
    new Setting(formatContainer)
        .setName('Output Path')
        .setDesc('The output directory for exported files, support placeholders(占位符)')
        .addText(text => {
            text.setPlaceholder('Enter path')
                .setValue((formatConfig.path && formatConfig.path !== '') ? // 如果path为空，则使用默认路径
                    formatConfig.path : path.join(placeholders.VAR_VAULT_DIR, 'output', placeholders.VAR_NOTE_NAME + '_' + formatConfig.format)) 
                .onChange(async (value) => {
                    formatConfig.path = value.trim();
                    await plugin.saveData(plugin.settingList);
                });
            text.inputEl.style.width = '100%';
        });

    if (!formatConfig.yaml) {
        formatConfig.yaml = FORMAT_DEFAULT_CONFIGS[formatConfig.format] || '';
    }
    // YAML配置设置
    new Setting(formatContainer)
        .setName('YAML Config')
        .setDesc('The YAML configuration for export')
        .addTextArea(text => {
            text.setPlaceholder('Enter YAML configuration')
                .setValue(formatConfig.yaml)
                .onChange(async (value) => {
                    formatConfig.yaml = value;
                    await plugin.saveData(plugin.settingList);
                });
            // Make textarea bigger
            text.inputEl.style.width = '100%';
            text.inputEl.style.height = '100px';
            return text;
        });

    new Setting(formatContainer)
        .setName('Excalidraw Export Type')
        .setDesc('The type of excalidraw export')
        .addDropdown(dropdown => {
            dropdown.addOption('png', 'PNG')
                .addOption('svg', 'SVG')
                .setValue(formatConfig.excalidraw_export_type || 'png') // 如果excalidraw_export_type为空，则使用默认值
                .onChange(async (value) => {
                    formatConfig.excalidraw_export_type = value as 'png' | 'svg';
                    await plugin.saveData(plugin.settingList);
                });
        });

    // 删除按钮和打开附件文件夹按钮
    new Setting(formatContainer)
        .setName('Format Actions')
        .setDesc('Actions for this format configuration')
        .addButton(button => button
            .setButtonText('Delete')
            .onClick(async () => {
                // 删除对应的资源文件夹
                const formatStylesPath = path.join(
                    plugin.PLUGIN_ABS_PATH,
                    'assets',
                    'styles',
                    formatConfig.id
                );
                if (fs.existsSync(formatStylesPath)) {
                    fs.rmSync(formatStylesPath, { recursive: true, force: true });
                }
                
                // 从设置中移除该格式
                const settings = plugin.settingList[exportFormatsSetting.name] as ExportFormatsSettings;
                const index = settings.formats.findIndex(item => item.id == formatConfig.id);
                settings.formats.splice(index, 1);
                await plugin.saveData(plugin.settingList);
                
                // 直接从DOM中移除当前格式的容器，而不是重新渲染整个设置区
                formatContainer.parentElement?.remove();
            }))
        .addButton(button => button
            .setButtonText('Open Assets Folder')
            .onClick(() => {
                const formatStylesPath = path.join(
                    plugin.PLUGIN_ABS_PATH,
                    'assets',
                    'styles',
                    formatConfig.id
                );
                // 如果文件夹不存在，先创建它
                if (!fs.existsSync(formatStylesPath)) {
                    fs.mkdirSync(formatStylesPath, { recursive: true });
                }
                // 使用系统默认程序打开文件夹
                const command = process.platform === 'win32'
                    ? `explorer "${formatStylesPath}"`
                    : process.platform === 'darwin'
                        ? `open "${formatStylesPath}"`
                        : `xdg-open "${formatStylesPath}"`;
                child_process.exec(command);
            }));
}

// 添加导出格式相关的设置项到设置面板
function addExportFormatsSettingTab(containerEl: HTMLElement, plugin: MyPlugin): void {
    containerEl.createEl('h3', { text: 'Export Formats Settings' });
    
    const settings = plugin.settingList[exportFormatsSetting.name] as ExportFormatsSettings;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .format-settings {
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 16px;
        }
        .format-header {
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        .format-title {
            margin: 0;
            flex-grow: 1;
        }
        .format-controls {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .format-enable-toggle {
            margin: 0;
        }
        .format-enable-toggle .checkbox-container {
            vertical-align: middle;
        }
        .format-toggle-icon {
            transition: transform 0.2s ease;
            margin-left: 4px;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
        }
        .format-toggle-icon.expanded {
            transform: rotate(180deg);
        }
        .format-detail-container {
            margin-top: 12px;
            display: none;
        }
        .format-detail-container.visible {
            display: block;
        }
        /* 移除setting组件的底部外边距，使界面更紧凑 */
        .format-header .setting-item {
            margin: 0;
            border: none;
            padding: 0;
        }
        /* 禁用状态的视觉反馈 */
        .format-disabled h4 {
            opacity: 0.6;
        }
    `;
    containerEl.appendChild(style);
    
    // 添加现有格式的设置
    settings.formats.forEach((format) => {
        const formatContainer = containerEl.createEl('div', { 
            cls: `format-settings ${!format.enabled ? 'format-disabled' : ''}`
        });
        
        // 创建格式标题和展开/收起控制区域
        const headerEl = formatContainer.createEl('div', { cls: 'format-header' });
        
        // 格式标题
        headerEl.createEl('h4', { 
            text: `${format.name} (${format.format || 'unknown format'})`,
            cls: 'format-title'
        });
        
        // 创建控制区域（包含启用开关和展开/收起图标）
        const controlsEl = headerEl.createEl('div', { cls: 'format-controls' });
        
        // 启用开关
        const toggleSetting = new Setting(controlsEl)
            .setClass('format-enable-toggle')
            .addToggle(toggle => toggle
                .setValue(format.enabled)
                .onChange(async (value) => {
                    format.enabled = value;
                    await plugin.saveData(plugin.settingList);
                    // 更新禁用状态的视觉反馈
                    formatContainer.classList.toggle('format-disabled', !value);
                }));
        
        // 移除Setting组件默认的名称和描述区域
        toggleSetting.nameEl.remove();
        toggleSetting.descEl.remove();
        
        // 创建展开/收起图标
        const toggleIcon = controlsEl.createEl('span', { 
            text: '▼', 
            cls: 'format-toggle-icon'
        });
        
        // 创建详细设置的容器
        const detailContainer = formatContainer.createEl('div', { 
            cls: 'format-detail-container'
        });
        
        // 添加详细设置项
        renderFormatDetailSettings(detailContainer, format, plugin);
        
        // 点击标题区域时切换详细设置的显示/隐藏
        headerEl.addEventListener('click', (event) => {
            // 如果点击的是toggleSwitch或其子元素，不处理展开/收起
            if (event.target instanceof HTMLElement && 
                (toggleSetting.controlEl.contains(event.target) || 
                 toggleSetting.controlEl === event.target)) {
                return;
            }
            
            const isVisible = detailContainer.classList.toggle('visible');
            toggleIcon.classList.toggle('expanded', isVisible);
        });
    });

    // 添加新格式按钮
    new Setting(containerEl)
        .setName('Add New Format')
        .setDesc('Add a new export format configuration')
        .addDropdown(dropdown => {
            dropdown
                .addOption('quarto', 'Quarto')
                .addOption('vuepress', 'VuePress')
                .addOption('typst', 'Typst')
                .setValue('quarto')
                .onChange(() => {}); // 空函数，因为我们只在点击Add按钮时使用选择的值
            return dropdown;
        })
        .addButton(button => button
            .setButtonText('Add')
            .onClick(async () => {
                const hexId = generateHexId();
                const selectedFormat = containerEl.querySelector('select')?.value as OutputFormat || 'quarto';
                const newFormat: FormatConfig = {
                    id: `${selectedFormat}-${hexId}`,
                    name: `${selectedFormat.charAt(0).toUpperCase() + selectedFormat.slice(1)} ${hexId}`,
                    path: path.join(placeholders.VAR_VAULT_DIR, 'output', placeholders.VAR_NOTE_NAME + '_' + selectedFormat),
                    yaml: FORMAT_DEFAULT_CONFIGS[selectedFormat] || '',  // 提供默认空字符串
                    enabled: true,
                    format: selectedFormat
                };

                // 创建对应的资源文件夹
                const formatStylesPath = path.join(
                    plugin.PLUGIN_ABS_PATH,
                    'assets',
                    'styles',
                    newFormat.id
                );
                if (!fs.existsSync(formatStylesPath)) {
                    fs.mkdirSync(formatStylesPath, { recursive: true });
                    // 从默认依赖文件夹复制资源文件
                    createFormatAssetStructure(formatStylesPath, selectedFormat, plugin);
                }

                settings.formats.push(newFormat);
                await plugin.saveData(plugin.settingList);
                // 重新渲染当前内容区域
                containerEl.empty();
                addExportFormatsSettingTab(containerEl, plugin);
            }));
}

export const exportFormatsSetting: SettingsRegistry = {
    name: 'exportFormats',
    description: 'Settings for export formats',
    defaultSettings: DEFAULT_EXPORT_FORMATS_SETTINGS,
    renderSettingTab: addExportFormatsSettingTab
}