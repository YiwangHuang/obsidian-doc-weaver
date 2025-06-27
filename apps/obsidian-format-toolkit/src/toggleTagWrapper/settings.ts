import { Setting } from 'obsidian';
import type MyPlugin from '../main';
import { SettingsRegistry } from '../main';

// 从types.ts导入类型定义
import { TagConfig, TagWrapperSettings, DEFAULT_TAG_WRAPPER_SETTINGS, generateHexId } from './types';



// 添加设置面板
export function addTagWrapperSettingTab(containerEl: HTMLElement, plugin: MyPlugin): void {
    containerEl.createEl('h3', { text: 'Tag Wrapper Settings' });
    
    const settings = plugin.settingList[tagWrapperSetting.name] as TagWrapperSettings;
    
    // 添加现有标签的设置
    settings.tags.forEach((tag, index) => {
        const tagContainer = containerEl.createEl('div', { cls: 'tag-settings' });
        
        // 启用开关
        new Setting(tagContainer)
            .setName(`Enable ${tag.name}`)
            .addToggle(toggle => toggle
                .setValue(tag.enabled)
                .onChange(async (value) => {
                    settings.tags[index].enabled = value;
                    await plugin.saveData(plugin.settingList);
                    // 重新渲染当前内容区域
                    containerEl.empty();
                    addTagWrapperSettingTab(containerEl, plugin);
                }));

        if (tag.enabled) {
            // 命令名称设置
            new Setting(tagContainer)
                .setName('Command Name')
                .addText(text => text
                    .setValue(tag.name)
                    .onChange(async (value) => {
                        settings.tags[index].name = value;
                        await plugin.saveData(plugin.settingList);
                    }));

            // 开始标签设置
            new Setting(tagContainer)
                .setName('Opening Tag')
                .addText(text => text
                    .setValue(tag.prefix)
                    .onChange(async (value) => {
                        settings.tags[index].prefix = value;
                        await plugin.saveData(plugin.settingList);
                    }));

            // 结束标签设置
            new Setting(tagContainer)
                .setName('Closing Tag')
                .addText(text => text
                    .setValue(tag.suffix)
                    .onChange(async (value) => {
                        settings.tags[index].suffix = value;
                        await plugin.saveData(plugin.settingList);
                    }));

            // 删除按钮
            new Setting(tagContainer)
                .addButton(button => button
                    .setButtonText('Delete')
                    .onClick(async () => {
                        settings.tags.splice(index, 1);
                        await plugin.saveData(plugin.settingList);
                        // 重新渲染当前内容区域
                        containerEl.empty();
                        addTagWrapperSettingTab(containerEl, plugin);
                    }));
        }
    });

    // 添加新标签按钮
    new Setting(containerEl)
        .setName('Add New Tag')
        .setDesc('Add a new tag wrapper configuration')
        .addButton(button => button
            .setButtonText('Add')
            .onClick(async () => {
                const hexId = generateHexId();
                const newTag: TagConfig = {
                    id: `tag-${hexId}`,
                    name: `Tag ${hexId}`,
                    prefix: '<tag>',
                    suffix: '</tag>',
                    enabled: true
                };
                settings.tags.push(newTag);
                await plugin.saveData(plugin.settingList);
                // 重新渲染当前内容区域
                containerEl.empty();
                addTagWrapperSettingTab(containerEl, plugin);
            }));
}

export const tagWrapperSetting: SettingsRegistry = {
    name: 'tagWrapper',
    description: 'Settings for tag wrapper commands',
    defaultSettings: DEFAULT_TAG_WRAPPER_SETTINGS,
    renderSettingTab: addTagWrapperSettingTab
}