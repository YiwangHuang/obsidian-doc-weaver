import { App, DataAdapter, FileSystemAdapter, Notice, Plugin, PluginSettingTab, TFile } from 'obsidian';
import path from 'path';

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
		const ribbonIconEl = this.addRibbonIcon('dice', 'Format Toolkit', (evt: MouseEvent) => {
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

    // 查找所有 Markdown 文件，备用
    findMarkdownFiles(fileName: string): TFile[] {
        const allFiles = this.app.vault.getAllLoadedFiles();
        return allFiles.filter(file => 
            file instanceof TFile && 
            file.extension === 'md' && 
            file.name.includes(fileName)
        ) as TFile[];
    }

    // 查找所有图片文件，备用
    findImageFiles(fileName: string): TFile[] {
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
        const allFiles = this.app.vault.getAllLoadedFiles();
        return allFiles.filter(file => 
            file instanceof TFile && 
            imageExtensions.includes(file.extension) &&
            file.name.includes(fileName)
        ) as TFile[];
    }

    // 按文件类型查找，备用
    findFilesByType(fileName: string, extension: string): TFile[] {
        const allFiles = this.app.vault.getAllLoadedFiles();
        return allFiles.filter(file => 
            file instanceof TFile && 
            file.extension === extension &&
            file.name.includes(fileName)
        ) as TFile[];
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

        this.createTabContainer(containerEl);
        this.createContentContainer(containerEl);
        this.addTabStyles();
    }

    private createTabContainer(containerEl: HTMLElement): void {
        const tabContainer = containerEl.createEl('div', { cls: 'setting-tabs' });
        
        this.moduleSettings.forEach(setting => {
            const tabButton = this.createTabButton(tabContainer, setting);
            if (setting.description) {
                tabButton.setAttribute('aria-label', setting.description);
            }
        });
    }

    private createTabButton(container: HTMLElement, setting: SettingsRegistry): HTMLElement {
        const tabButton = container.createEl('button', {
            text: setting.name,
            cls: `setting-tab-button ${this.activeTab === setting.name ? 'active' : ''}`
        });

        tabButton.onclick = () => this.handleTabClick(container, tabButton, setting.name);
        return tabButton;
    }

    private handleTabClick(container: HTMLElement, clickedButton: HTMLElement, settingName: string): void {
        container.findAll('.setting-tab-button').forEach(el => el.removeClass('active'));
        clickedButton.addClass('active');
        this.activeTab = settingName;

        const contentEl = container.parentElement?.querySelector('.setting-tab-content');
        if (contentEl) {
            this.showActiveTabContent(contentEl as HTMLElement);
        }
    }

    private createContentContainer(containerEl: HTMLElement): void {
        const contentEl = containerEl.createDiv('setting-tab-content');
        this.showActiveTabContent(contentEl);
    }

    private showActiveTabContent(containerEl: HTMLElement): void {
        containerEl.empty();
        const activeSetting = this.moduleSettings.find(setting => setting.name === this.activeTab);
        if (activeSetting) {
            activeSetting.renderSettingTab(containerEl, this.plugin);
        }
    }

    private addTabStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .setting-tabs {
                display: flex;
                border-bottom: 1px solid var(--background-modifier-border);
                margin-bottom: 16px;
            }
            .setting-tab-button {
                padding: 8px 16px;
                margin: 0 8px;
                border: none;
                background: none;
                cursor: pointer;
                color: var(--text-muted);
                border-bottom: 2px solid transparent;
            }
            .setting-tab-button:first-child {
                margin-left: 0;
            }
            .setting-tab-button:hover {
                color: var(--text-normal);
            }
            .setting-tab-button.active {
                color: var(--text-normal);
                border-bottom: 2px solid var(--interactive-accent);
            }
            .setting-tab-content {
                padding: 8px 0;
            }
        `;
        document.head.appendChild(style);
    }
}

