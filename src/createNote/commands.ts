import { Notice } from 'obsidian';
import type MyPlugin from '../../main';
import { CreateNoteSettings, createNoteSetting } from './settings';

// 创建笔记的命令
export function addGetCreateNoteCommands(plugin: MyPlugin): void {
    plugin.addCommand({
        id: 'create-new-note',
        name: 'Create New Note',
        callback: async () => {
            try {
                // 获取设置
                const settings = plugin.settingList[createNoteSetting.name] as CreateNoteSettings;
                
                // 确保路径存在
                const path = settings.notePath;
                if (!path) {
                    new Notice('Please set a valid path in settings');
                    return;
                }

                // 生成文件名
                const moment = window.moment();
                const fileName = settings.fileNameTemplate
                    .replace('YYYY', moment.format('YYYY'))
                    .replace('MM', moment.format('MM'))
                    .replace('DD', moment.format('DD'));

                // 构建完整路径
                const fullPath = `${path}/${fileName}.md`;

                // 检查文件是否已存在
                const exists = await plugin.app.vault.adapter.exists(fullPath);
                if (exists) {
                    new Notice(`File ${fileName}.md already exists!`);
                    return;
                }

                // 创建新文件
                const file = await plugin.app.vault.create(fullPath, '');
                new Notice(`Created new note: ${fileName}.md`);

                // 打开新创建的文件
                const leaf = plugin.app.workspace.getUnpinnedLeaf();
                await leaf.openFile(file);

            } catch (error) {
                console.error('Error creating new note:', error);
                new Notice('Failed to create new note');
            }
        }
    });
} 