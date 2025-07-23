import { App, DataAdapter, FileSystemAdapter, Notice, Plugin, PluginSettingTab, TFile } from 'obsidian';
import path from 'path';
import { createApp, App as VueApp, reactive, watch } from 'vue';
import SettingsApp from './vue/components/SettingsApp.vue';
import { debugLog } from './lib/testUtils';
import { debounce } from 'lodash';

// Vuetify
import 'vuetify/styles'
import { vuetify } from './vue/plugins/vuetify'

// import { 
// 	addGetCreateNoteCommands,
// 	createNoteSetting
// } from './src/createNote/index';

import {
	exportFormatsSetting,
    ExportFormatsManager,
    // exportToFormats,
    addExportFormatsCommands
} from './exportFormats/index';	

import { 
    TagWrapperManager,
    tagWrapperSetting
} from './toggleTagWrapper/index';

import {
    QuickTemplateManager,
    quickTemplateSettingTab
} from './quickTemplate/index';

// 定义设置注册接口
export interface SettingsRegistry<T = any> {
    name: string;
    description: string;
    defaultConfigs: T;
    settingTabName: string; // 设置页面中显示的标签名
    component?: any; // Vue组件，可选字段
}

export default class MyPlugin extends Plugin {
	private vaultAdapter: DataAdapter;	
	VAULT_ABS_PATH: string;
	PLUGIN_ABS_PATH: string;
    // 将settingList改成响应式对象，支持深度监听嵌套对象的变化
    settingList: { [key: string]: any } = reactive({});
    moduleSettings: SettingsRegistry[] = [];
    commandCache: { [key: string]: object } = {};// 命令缓存
    tagWrapperManager: TagWrapperManager;
    exportFormatsManager: ExportFormatsManager;
    quickTemplateManager: QuickTemplateManager;
    
    // 用于控制是否启用自动保存，避免初始化时触发保存
    private enableAutoSave = false;

	async onload() {
		this.vaultAdapter = this.app.vault.adapter;
		this.VAULT_ABS_PATH = this.vaultAdapter instanceof FileSystemAdapter ? this.vaultAdapter.getBasePath() : '';
		this.PLUGIN_ABS_PATH = path.join(this.VAULT_ABS_PATH, this.manifest.dir || '');
        // 注册所有设置模块
        
        // 加载保存的设置
        const savedData = await this.loadData();

        // 修复BUG：当data.json不存在时，loadData()返回null，需要提供默认的空对象
        this.settingList = reactive(savedData || {});
        
        debugLog('settingList', savedData);

        // 先注册所有设置模块（确保默认配置被设置到响应式对象中）
        this.registerSettings(exportFormatsSetting);
        this.registerSettings(tagWrapperSetting);
        this.registerSettings(quickTemplateSettingTab);
        
        // 然后初始化管理器（这样它们能获取到正确的响应式配置对象）
        this.tagWrapperManager = new TagWrapperManager(this);
        this.exportFormatsManager = new ExportFormatsManager(this);
        this.quickTemplateManager = new QuickTemplateManager(this);

        // 设置watch监听器，监听settingList的深层变化并自动保存
        // TODO: 考虑自己实现的防抖函数，避免lodash的依赖，减小包体积
        watch(() => this.settingList, debounce(async (newVal, oldVal) => {
            if (this.enableAutoSave) {
                debugLog('Settings changed, auto-saving...');
                await this.saveData(this.settingList);
            }
        }, 500), { deep: true }); // 深度监听，能够监听嵌套对象的变化
        
        // 初始化完成后启用自动保存
        this.enableAutoSave = true;
        
        // 创建设置标签页
        this.addSettingTab(new AlternativeSettingTab(this.app, this));

		// // 在左侧功能区创建一个图标按钮
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Doc Weaver', (evt: MouseEvent) => {
		// 	new Notice('This is a notice!');
		// });
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// 注册所有命令
		// 使用新的动态命令管理系统
        // this.tagWrapperCommandManager = DynamicCommandManager.initialize(this);
        // this.tagWrapperCommandManager.initialize(this.settingList[tagWrapperSetting.name] as any);
        
        // 注册其他命令（保持原有方式）
        addExportFormatsCommands(this);
        
        console.log('Plugin loaded with dynamic command management and reactive settings');
	}

    /**
     * 注册模块设置
     */
    registerSettings<T extends object>(setting: SettingsRegistry<T>): void {
        this.moduleSettings.push(setting);
        
        // 获取当前设置
        const currentSettings = this.settingList[setting.name];
        
        // 检查设置是否需要重置
        const needsReset = !currentSettings || 
            // 检查所有必需的属性是否存在且类型匹配
            !Object.entries(setting.defaultConfigs).every(([key, value]) => {
                return currentSettings.hasOwnProperty(key) && 
                       typeof currentSettings[key] === typeof value;
            });
        
        if (needsReset) {
            console.log(`Initializing settings for ${setting.name} with type checking`);
            this.settingList[setting.name] = setting.defaultConfigs;
        }
    }

    /**
     * 设置变更通知 - 由设置界面调用//TODO: 完全删除这个函数
     * 完全通用的设置更新处理，不依赖具体模块
     * 现在通过响应式对象和watch监听器自动保存，无需手动调用saveData
     * @param moduleName 设置名称
     * @param newModuleConfig 新的设置值
     */
    async onSettingsChange(moduleName: string, newModuleConfig: any): Promise<void> {
        // 更新内部设置 - 由于settingList是响应式对象，watch监听器会自动触发保存
        this.settingList[moduleName] = newModuleConfig;
    }

    /**
     * 获取指定模块的设置
     * @param settingName 设置名称
     */
    getSettings<T>(settingName: string): T {
        return this.settingList[settingName] as T;
    }

	onunload() {
        if (this.tagWrapperManager) {
            this.tagWrapperManager.cleanup();
        }
        if (this.quickTemplateManager) {
            this.quickTemplateManager.cleanup();
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
        
        // 使用Vuetify插件
        this.vueApp.use(vuetify);

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

