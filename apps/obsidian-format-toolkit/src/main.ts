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
    DynamicCommandManager,
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

// 定义模块更新处理器接口
export interface ModuleUpdateHandler {
    (newSettings: any): void;
}

// 模块更新处理器注册表
const MODULE_UPDATE_HANDLERS: Record<string, ModuleUpdateHandler> = {
    [tagWrapperSetting.name]: (newSettings) => {
        DynamicCommandManager.updateCommands(newSettings);
        console.log('Tag wrapper commands updated due to settings change');
    },
    // 可扩展其他模块
    // [exportFormatsSetting.name]: (newSettings) => {
    //     ExportFormatsManager.updateCommands(newSettings);
    //     console.log('Export formats commands updated due to settings change');
    // },
};

export default class MyPlugin extends Plugin {
	private vaultAdapter: DataAdapter;	
	VAULT_ABS_PATH: string;
	PLUGIN_ABS_PATH: string;
    settingList: { [key: string]: object } = {};
    moduleSettings: SettingsRegistry[] = [];
    commandCache: { [key: string]: object } = {};// 命令缓存
    
    // 动态命令管理器
    private tagWrapperCommandManager: DynamicCommandManager | null = null;

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
		// 使用新的动态命令管理系统
        this.tagWrapperCommandManager = DynamicCommandManager.initialize(this);
        this.tagWrapperCommandManager.initialize(this.settingList[tagWrapperSetting.name] as any);
        
        // 注册其他命令（保持原有方式）
        addExportFormatsCommands(this);
        
        console.log('Plugin loaded with dynamic command management');
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

    /**
     * 设置变更通知 - 由设置界面调用
     * 完全通用的设置更新处理，不依赖具体模块
     * @param settingName 设置名称
     * @param newSettings 新的设置值
     */
    async onSettingsChange(settingName: string, newSettings: any): Promise<void> {
        // 更新内部设置
        this.settingList[settingName] = newSettings;
        
        // 保存到磁盘
        await this.saveData(this.settingList);
        
        // 查找并调用对应的模块更新处理器
        const updateHandler = MODULE_UPDATE_HANDLERS[settingName];
        if (updateHandler) {
            updateHandler(newSettings);
        } else {
            console.log(`No update handler found for setting: ${settingName}`);
        }
    }

    /**
     * 获取指定模块的设置
     * @param settingName 设置名称
     */
    getSettings<T>(settingName: string): T {
        return this.settingList[settingName] as T;
    }

	onunload() {
        // 清理动态命令管理器
        if (this.tagWrapperCommandManager) {
            DynamicCommandManager.cleanup();
            this.tagWrapperCommandManager = null;
        }
        
        console.log('Plugin unloaded, commands cleaned up');
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

