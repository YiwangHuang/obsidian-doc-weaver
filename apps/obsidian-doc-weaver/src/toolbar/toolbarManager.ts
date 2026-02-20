import type DocWeaver from "../main";
import type { DocWeaverInstance } from "../main";
import type { Command } from "obsidian";

import { createApp, App as VueApp, computed, h } from "vue";
import { toolbarInfo, ToolbarSettings, toolbarSettingsIO } from "./index";
import { debugLog } from "../lib/debugUtils";

import EditingToolbar from './components/EditingToolbar.vue';
import { vuetify } from '../vue/plugins/vuetify';
import type { ToolbarItemConfig, ExtraCommandConfig } from './types';

import { tagWrapperInfo } from '../toggleTagWrapper/index';
import { TagWrapperSettings } from '../toggleTagWrapper/types';

import { quickTemplateInfo, QuickTemplateSettings } from '../quickTemplate/index';

import { exportFormatsInfo } from '../exportFormats/index';
import { ExportManagerSettings } from '../exportFormats/types';

/**
 * 通用模块管理器
 * 负责管理通用配置和功能
 */
export class ToolbarManager {
    private plugin: DocWeaver;
    private toolBarApp: VueApp | null = null;
    private toolBarContainer: HTMLElement | null = null;

    constructor(plugin: DocWeaver) {
        this.plugin = plugin;
        // 第一步：注册模块设置
        this.registerSettings();
        this.initialize();
    }

    /**
     * 注册模块设置到插件的响应式设置列表中
     */
    private registerSettings(): void {
        // 校验并修复当前设置，无效或缺失时回退到默认配置
        this.plugin.settingList[toolbarInfo.name] = toolbarSettingsIO.ensureValid(
            this.plugin.settingList[toolbarInfo.name],
            toolbarInfo.defaultConfigs
        );

        // 将模块信息添加到插件的模块设置列表中
        this.plugin.moduleSettings.push(toolbarInfo);
    }

    /**
     * 获取当前配置（始终从响应式settingList中获取最新配置）
     */
    get config(): ToolbarSettings {
        return this.plugin.settingList[toolbarInfo.name] as ToolbarSettings;
    }

    /**
     * 初始化通用模块管理器
     */
    initialize(): void {
        // 直接初始化工具栏，可见性由组件内部的 visible 属性控制
        this.initializeToolBar();
    }

    
    /**
     * 收集工具栏项目数据
     * 关键：创建新数组副本以确保数组增减操作能被响应式系统正确追踪
     */
    private collectToolbarItems(): ToolbarItemConfig[] {
        const items: ToolbarItemConfig[] = [];
        
        // 直接从响应式settingList获取数据，确保依赖收集正确
        const exportFormatsItems = this.plugin.settingList[exportFormatsInfo.name] as ExportManagerSettings;
        const tagWrapperItems = this.plugin.settingList[tagWrapperInfo.name] as TagWrapperSettings;
        const quickTemplateItems = this.plugin.settingList[quickTemplateInfo.name] as QuickTemplateSettings;
        const toolbarItems = this.plugin.settingList[toolbarInfo.name] as ToolbarSettings;
        
        // 创建数组副本以确保数组增减操作能被响应式系统追踪
        items.push({
            name: '导出格式',
            icon: 'file-up',
            enabled: true,
            children: [...exportFormatsItems.exportConfigs]  // 创建副本追踪数组变化
        });
        
        items.push({
            name: '标签包装器',
            icon: 'code-xml',
            enabled: true,
            unfolded: false,
            children: [...tagWrapperItems.tags]  // 创建副本追踪数组变化
        });
        
        // 合并两个数组并创建副本
        const merged = [...quickTemplateItems.templates];
        items.push({
            name: '快捷模板',
            icon: 'puzzle',
            enabled: true,
            unfolded: false,
            children: merged  // 合并后的数组本身就是新创建的
        });
        
        // 添加用户自定义命令（只有启用的才显示）
        const extraCommands = toolbarItems.extraCommands
        if (extraCommands.length > 0) {
            items.push(...extraCommands.map(cmd => ({ ...cmd }))); // 创建副本追踪变化
        }

        return items;
    }
    
    /**
     * 初始化 SpeedDial 组件
     */
    private initializeToolBar(): void {
        try {
            // 检查是否已经存在容器，如果存在则不重复创建
            const existingContainer = document.getElementById('toolbar-speed-dial-container');
            if (existingContainer) {
                debugLog('SpeedDial container already exists, skipping initialization');
                return;
            }

            // 创建容器元素
            this.toolBarContainer = document.createElement('div');
            this.toolBarContainer.id = 'toolbar-speed-dial-container';
            
            // 将容器添加到 body
            document.body.appendChild(this.toolBarContainer);
            
            // 创建工具栏上下文对象
            const docWeaverInstance: DocWeaverInstance = {
                plugin: this.plugin,
                app: this.plugin.app
            };
            
            /**
             * 创建包装组件来处理响应式props传递
             * 
             * Vue 3 的 createApp 第二个参数期望普通对象作为props，
             * 而不是响应式对象。因此我们创建一个包装组件：
             * 1. 在setup中使用computed响应数据变化
             * 2. 通过render函数将计算结果作为普通props传递给目标组件
             * 
             * 这样确保了响应式数据变化能正确传播到子组件
             */
            const ToolbarWrapper = {
                setup: () => {
                    const items = computed(() => {
                        return this.collectToolbarItems();
                    });
                    
                    return {
                        items
                    };
                },
                render() {
                    return h(EditingToolbar, { items: this.items });
                }
            };

            this.toolBarApp = createApp(ToolbarWrapper);
            this.toolBarApp.use(vuetify);
            this.toolBarApp.provide('docWeaverInstance', docWeaverInstance);
            
            this.toolBarApp.mount(this.toolBarContainer);
            
            debugLog('SpeedDial component initialized');
        } catch (error) {
            console.error('Failed to initialize SpeedDial component:', error);
        }
    }

    addExtraCommand(command: Command): void {
        const newCommand: ExtraCommandConfig = {
            commandId: command.id,
            name: command.name,
            enabled: true,
            icon: command.icon || 'question-mark-glyph'
        };
        this.config.extraCommands.push(newCommand);
    }

    /**
     * 销毁管理器，清理资源
     */
    destroy(): void {
        try {
            // 卸载 Vue 应用
            if (this.toolBarApp) {
                this.toolBarApp.unmount();
                this.toolBarApp = null;
            }
            
            // 移除容器元素
            if (this.toolBarContainer && this.toolBarContainer.parentNode) {
                this.toolBarContainer.parentNode.removeChild(this.toolBarContainer);
                this.toolBarContainer = null;
            }
            
            debugLog('Toolbar manager destroyed');
        } catch (error) {
            console.error('Failed to destroy toolbar manager:', error);
        }
    }
}