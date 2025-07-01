import { App, DataAdapter, FileSystemAdapter, Notice, Plugin, PluginSettingTab, TFile } from 'obsidian';
import path from 'path';
import { createApp, App as VueApp } from 'vue';
import SettingsApp from './vue/components/SettingsApp.vue';

// import { 
// 	addGetCreateNoteCommands,
// 	createNoteSetting
// } from './src/createNote/index';

import {
	exportFormatsSetting,
    // exportToFormats,
    addExportFormatsCommands
} from './exportFormats/index';	

import { 
    addGetTagWrapperCommands,
    tagWrapperSetting
} from './toggleTagWrapper/index';

export default class MyPlugin extends Plugin {
	private vaultAdapter: DataAdapter;	
	VAULT_ABS_PATH: string;
	PLUGIN_ABS_PATH: string;
    settingList: { [key: string]: object } = {};
    settingTab: initSettingTab;
    commandCache: { [key: string]: object } = {};// 命令缓存

	async onload() {
		this.vaultAdapter = this.app.vault.adapter;
		this.VAULT_ABS_PATH = this.vaultAdapter instanceof FileSystemAdapter ? this.vaultAdapter.getBasePath() : '';
		this.PLUGIN_ABS_PATH = path.join(this.VAULT_ABS_PATH, this.manifest.dir || '');
		// 初始化设置
        this.settingTab = new initSettingTab(this.app, this);
        
        // 注册所有设置模块
        // this.settingTab.registerSettings(createNoteSetting);
        this.settingTab.registerSettings(exportFormatsSetting);
        this.settingTab.registerSettings(tagWrapperSetting);
        
        // 注册Demo模块（用于演示Vue弹窗组件）
        this.settingTab.registerSettings({
            name: 'modalDemo',
            description: 'Vue弹窗组件演示',
            defaultSettings: {},
            renderSettingTab: (containerEl: HTMLElement, plugin: MyPlugin) => {
                containerEl.createEl('h3', { text: 'Vue Modal Demo' });
                containerEl.createEl('p', { 
                    text: '这个标签页展示了Vue弹窗组件的使用方法。请启用Vue模式查看完整演示。' 
                });
            }
        });
        
        // 加载保存的设置
        const savedData = await this.loadData();
        if (savedData) {
            // 合并保存的设置和默认设置
            Object.keys(this.settingList).forEach(key => {
                this.settingList[key] = {
                    ...this.settingList[key],  // 默认设置
                    ...(savedData[key] || {})  // 保存的设置
                };
            });
        }
        
        // 渲染设置标签页
        this.settingTab.renderSettingTab();

		// 在左侧功能区创建一个图标按钮
		const ribbonIconEl = this.addRibbonIcon('dice', 'Doc Weaver', (evt: MouseEvent) => {
			new Notice('This is a notice!');
		});
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// 注册所有命令
		// addGetCreateNoteCommands(this);
        addExportFormatsCommands(this);
		addGetTagWrapperCommands(this);
	}

	onunload() {
	}

    // 获取文件file的附件的默认存储位置，备用
    public getAttachmentDirRel(file: TFile): string {
        if (file.extension !== 'md') {
            new Notice(`getAttachmentDirRel: cannot process ${file.extension} files. Please select a Markdown file.`);
            return '';
        }
        // 获取 Obsidian 的附件配置，"/"开头表示在库目录下，"./"开头相对于工作文件根目录下的位置，没有前两者表示相对库目录的位置
        const defaultAttachmentSetting = (this.app.vault as any).config?.attachmentFolderPath || '/';
        let defaultRelativeDir: string;
        if (defaultAttachmentSetting.startsWith('./')) {
            defaultRelativeDir = path.join(file.parent?.path || '', defaultAttachmentSetting);
        } else {
            defaultRelativeDir = defaultAttachmentSetting;
        }
        // 确保路径以'/'结尾，仅为了美观，不必要
        return defaultRelativeDir.endsWith('/') ? defaultRelativeDir : defaultRelativeDir + '/'; 
    }
    
    // 获取相对路径(相对于库目录)的绝对路径
    public getPathAbs(pathRel: string): string {
        return path.join(this.VAULT_ABS_PATH, pathRel);
    }
}

// 定义设置注册接口
export interface SettingsRegistry {
    name: string;
    description: string;
    defaultSettings: object;
    renderSettingTab: (containerEl: HTMLElement, plugin: MyPlugin) => void;
}

class initSettingTab  {
    plugin: MyPlugin;
    moduleSettings: SettingsRegistry[] = [];
    app: App;

    constructor(app: App, plugin: MyPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    // 注册模块设置
    registerSettings(setting: SettingsRegistry) {
        this.moduleSettings.push(setting);
        // 初始化模块设置
        if (!this.plugin.settingList[setting.name]) {
            this.plugin.settingList[setting.name] = setting.defaultSettings;
        }
    }
    renderSettingTab() {
        this.plugin.addSettingTab(new AlternativeSettingTab(this.app, this.plugin, this));
    }
}

// 设置面板类
export class AlternativeSettingTab extends PluginSettingTab {
    plugin: MyPlugin;
    activeTab: string;
    private vueApp?: VueApp;
    
    // 定义所有可用的设置选项卡
    private readonly moduleSettings: SettingsRegistry[];

    constructor(app: App, plugin: MyPlugin, settingTab: initSettingTab) {
        super(app, plugin);
        this.plugin = plugin;
        this.moduleSettings = settingTab.moduleSettings;
        this.activeTab = this.moduleSettings[0]?.name || '';
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();
        this.renderVueComponent(containerEl);
    }

    private renderVueComponent(containerEl: HTMLElement): void {
        // 创建Vue应用挂载点
        const mountPoint = containerEl.createDiv('vue-settings-container');
        
        // 创建Vue应用实例
        this.vueApp = createApp(SettingsApp, {
            plugin: this.plugin,
            moduleSettings: this.moduleSettings
        });
        
        // 挂载Vue应用
        this.vueApp.mount(mountPoint);
    }

    hide(): void {
        // 清理Vue应用
        if (this.vueApp) {
            this.vueApp.unmount();
            this.vueApp = undefined;
        }
    }
}

