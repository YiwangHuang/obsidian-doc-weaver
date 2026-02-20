import type DocWeaver from "../main";
import { baseInfo, baseSettingsIO } from "./index";

/**
 * Base 模块管理器
 * 目前仅负责在插件启动时注册模块的设置与元信息，不提供任何实际功能。
 */
export class BaseManager {
    /** 插件实例引用，用于访问全局设置与上下文 */
    private plugin: DocWeaver;

    constructor(plugin: DocWeaver) {
        this.plugin = plugin;
        // 第一步：注册模块设置（写入 settingList 与 moduleSettings）
        this.registerSettings();
        // 当前无需进一步初始化逻辑，预留扩展点
    }

    /**
     * 将 Base 模块的设置注册到插件的响应式设置列表中
     * 包含默认值初始化与类型校验，并在设置面板中增加对应的标签页。
     */
    private registerSettings(): void {
        // 校验并修复当前设置，无效或缺失时回退到默认配置
        this.plugin.settingList[baseInfo.name] = baseSettingsIO.ensureValid(
            this.plugin.settingList[baseInfo.name],
            baseInfo.defaultConfigs
        );

        // 将模块的元信息添加到插件的模块设置列表中，用于设置面板渲染标签页
        this.plugin.moduleSettings.push(baseInfo);
    }

    /**
     * 销毁 Base 模块管理器
     * 当前没有需要清理的资源，预留方法方便未来扩展。
     */
    destroy(): void {
        // 目前无状态需要清理，预留接口
    }
}

