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

// 定义设置注册接口
export interface SettingsRegistry {
    name: string;
    description: string;
    defaultSettings: object;
    settingTabName: string; // 设置页面中显示的标签名
    component?: any; // Vue组件，可选字段
}

export default class MyPlugin extends Plugin {
	private vaultAdapter: DataAdapter;	
	VAULT_ABS_PATH: string;
	PLUGIN_ABS_PATH: string;
    settingList: { [key: string]: object } = {};
    moduleSettings: SettingsRegistry[] = [];
    commandCache: { [key: string]: object } = {};// 命令缓存

	async onload() {
		this.vaultAdapter = this.app.vault.adapter;
		this.VAULT_ABS_PATH = this.vaultAdapter instanceof FileSystemAdapter ? this.vaultAdapter.getBasePath() : '';
		this.PLUGIN_ABS_PATH = path.join(this.VAULT_ABS_PATH, this.manifest.dir || '');
		
        // 注册所有设置模块
        this.registerSettings(exportFormatsSetting);
        this.registerSettings(tagWrapperSetting);
        
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
        
        // 创建设置标签页
        this.addSettingTab(new AlternativeSettingTab(this.app, this));

		// 在左侧功能区创建一个图标按钮
		const ribbonIconEl = this.addRibbonIcon('dice', 'Doc Weaver', (evt: MouseEvent) => {
			new Notice('This is a notice!');
		});
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// 注册所有命令
		// TODO: 新建命令后不能及时更新，需要重新加载插件，解决该问题
        addExportFormatsCommands(this);
		addGetTagWrapperCommands(this);
	}

    /**
     * 注册模块设置
     */
    registerSettings(setting: SettingsRegistry): void {
        this.moduleSettings.push(setting);
        // 初始化模块设置
        if (!this.settingList[setting.name]) {
            this.settingList[setting.name] = setting.defaultSettings;
        }
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

// 设置面板类
export class AlternativeSettingTab extends PluginSettingTab {
    plugin: MyPlugin;
    private vueApp?: VueApp;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
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
            moduleSettings: this.plugin.moduleSettings
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

