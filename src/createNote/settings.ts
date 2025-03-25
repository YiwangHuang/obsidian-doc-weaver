import { Setting } from 'obsidian';
import type MyPlugin from '../../main';
import { SettingsRegistry } from '../../main';

export interface CreateNoteSettings {
    notePath: string;
    fileNameTemplate: string;
}   

// 设置默认值
export const DEFAULT_CREATE_NOTE_SETTINGS: CreateNoteSettings = {
	notePath: '/',  // 默认在根目录
	fileNameTemplate: 'YYYY-MM-DD'  // 默认使用日期格式
}

// 添加创建笔记相关的设置项到设置面板
export function addCreateNoteSettingTab(containerEl: HTMLElement, plugin: MyPlugin): void {
    const settings = plugin.settingList[createNoteSetting.name] as CreateNoteSettings;
    
    // 添加笔记保存路径设置
    new Setting(containerEl)
        .setName('Note Save Path')
        .setDesc('The path where new notes will be saved')
        .addText(text => text
            .setPlaceholder('Enter path (e.g., /Notes/)')
            .setValue(settings.notePath)
            .onChange(async (value) => {
                settings.notePath = value;
                await plugin.saveData(plugin.settingList);
            }));

    // 添加文件命名模板设置
    new Setting(containerEl)
        .setName('File Name Template')
        .setDesc('Template for new note names (e.g., YYYY-MM-DD, Note-{{date}})')
        .addText(text => text
            .setPlaceholder('Enter template')
            .setValue(settings.fileNameTemplate)
            .onChange(async (value) => {
                settings.fileNameTemplate = value;
                await plugin.saveData(plugin.settingList);
            }));
}

export const createNoteSetting: SettingsRegistry = {
    name: 'createNote',
    description: 'Settings for note creation',
    defaultSettings: DEFAULT_CREATE_NOTE_SETTINGS,
    renderSettingTab: addCreateNoteSettingTab
}