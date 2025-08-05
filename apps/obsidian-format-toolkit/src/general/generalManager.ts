import type MyPlugin from "../main";

import { watch, createApp, App as VueApp } from "vue";
import { generalInfo, GeneralSettings, isGeneralSettings } from "./index";
import { debugLog } from "../lib/debugUtils";

import SpeedDialOverlay from './components/SpeedDialOverlay.vue';
import { vuetify } from '../vue/plugins/vuetify';

/**
 * 通用模块管理器
 * 负责管理通用配置和功能
 */
export class GeneralManager {
    private plugin: MyPlugin;
    private speedDialApp: VueApp | null = null;
    private speedDialContainer: HTMLElement | null = null;

    constructor(plugin: MyPlugin) {
        this.plugin = plugin;
        // 第一步：注册模块设置
        this.registerSettings();
        this.initialize();
    }

    /**
     * 注册模块设置到插件的响应式设置列表中
     */
    private registerSettings(): void {
        // 获取当前设置
        const currentSettings = this.plugin.settingList[generalInfo.name];
        
        // 使用类型守卫函数检查设置是否需要重置
        const needsReset = !currentSettings || !isGeneralSettings(currentSettings);
        
        if (needsReset) {
            console.log(`Initializing settings for ${generalInfo.name} with type checking`);
            this.plugin.settingList[generalInfo.name] = generalInfo.defaultConfigs;
        }

        // 将模块信息添加到插件的模块设置列表中
        this.plugin.moduleSettings.push(generalInfo);
    }

    /**
     * 获取当前配置（始终从响应式settingList中获取最新配置）
     */
    get config(): GeneralSettings {
        return this.plugin.settingList[generalInfo.name] as GeneralSettings;
    }

    /**
     * 初始化通用模块管理器
     */
    initialize(): void {
        // 监听 SpeedDial 显示设置变化
        this.watchSpeedDialSetting();

        // 根据初始设置决定是否显示 SpeedDial
        if (this.config.showSpeedDial) {
            this.initializeSpeedDial();
        }
    }

    /**
     * 监听 SpeedDial 显示设置变化
     */
    private watchSpeedDialSetting(): void {
        watch(() => this.config.showSpeedDial, (newValue) => {
            if (newValue) {
                this.initializeSpeedDial();
            } else {
                this.cleanupSpeedDial();
            }
        }, { immediate: false });
    }

    /**
     * 初始化 SpeedDial 组件
     */
    private initializeSpeedDial(): void {
        try {
            // 检查是否已经存在容器，如果存在则不重复创建
            const existingContainer = document.getElementById('general-speed-dial-container');
            if (existingContainer) {
                debugLog('SpeedDial container already exists, skipping initialization');
                return;
            }

            // 创建容器元素
            this.speedDialContainer = document.createElement('div');
            this.speedDialContainer.id = 'general-speed-dial-container';
            
            // 将容器添加到 body
            document.body.appendChild(this.speedDialContainer);
            
            // 创建 Vue 应用
            this.speedDialApp = createApp(SpeedDialOverlay);
            this.speedDialApp.use(vuetify);
            
            // 挂载到容器
            this.speedDialApp.mount(this.speedDialContainer);
            
            debugLog('SpeedDial component initialized');
        } catch (error) {
            console.error('Failed to initialize SpeedDial component:', error);
        }
    }

    /**
     * 清理 SpeedDial 组件
     */
    private cleanupSpeedDial(): void {
        try {
            // 卸载 Vue 应用
            if (this.speedDialApp) {
                this.speedDialApp.unmount();
                this.speedDialApp = null;
            }
            
            // 移除容器元素
            if (this.speedDialContainer && this.speedDialContainer.parentNode) {
                this.speedDialContainer.parentNode.removeChild(this.speedDialContainer);
                this.speedDialContainer = null;
            }
            
            debugLog('SpeedDial component cleaned up');
        } catch (error) {
            console.error('Failed to cleanup SpeedDial component:', error);
        }
    }

    /**
     * 销毁管理器，清理资源
     */
    destroy(): void {
        // 清理 SpeedDial 组件
        this.cleanupSpeedDial();
        
        debugLog('General manager destroyed');
    }
}