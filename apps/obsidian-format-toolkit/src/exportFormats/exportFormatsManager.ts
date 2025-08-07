import type MyPlugin from "../main";
import path from "path";
import fs from "fs";
import { ExportManagerSettings, ExportConfig, isExportManagerSettings } from "./types";
import { exportFormatsInfo } from "./index";
import { generateTimestamp } from "../lib/idGenerator";
import { OutputFormat } from "./textConvert/textConverter";
import { getDefaultYAML, createFormatAssetStructure } from './textConvert/defaultStyleConfig/styleConfigs';
import { debugLog } from "../lib/debugUtils";
import { EXPORT_FORMATS_CONSTANTS } from "./types";

export class ExportFormatsManager {
    private plugin: MyPlugin;

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
        const currentSettings = this.plugin.settingList[exportFormatsInfo.name];
        
        // 使用类型守卫函数检查设置是否需要重置
        const needsReset = !currentSettings || !isExportManagerSettings(currentSettings);
        
        if (needsReset) {
            console.log(`Initializing settings for ${exportFormatsInfo.name} with type checking`);
            this.plugin.settingList[exportFormatsInfo.name] = exportFormatsInfo.defaultConfigs;
        }

        // 将模块信息添加到插件的模块设置列表中
        this.plugin.moduleSettings.push(exportFormatsInfo);
    }

    /**
     * 获取当前配置（始终从响应式settingList中获取最新配置）
     */
    get config(): ExportManagerSettings {
        return this.plugin.settingList[exportFormatsInfo.name] as ExportManagerSettings;
    }

    initialize(): void {
        // 配置现在通过getter动态获取，无需检查空值
    }

    /**
     * 添加新导出格式配置
     */
    addExportFormatItem(format: OutputFormat): void {
        const hexId = generateTimestamp("hex");
        // 根据格式类型设置默认图标
        const getDefaultIcon = (format: OutputFormat): string => {
            switch (format) {
                case 'typst': return 'file-text';
                case 'vuepress': return 'book';
                case 'quarto': return 'file-code';
                case 'plain': return 'file';
                default: return 'download';
            }
        };
        
        const newConfig: ExportConfig = {
        id: hexId,
        style_dir: path.posix.join('styles', hexId),
        name: `${hexId}`,
        output_dir: path.posix.join(EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_DIR, hexId),
        output_base_name: EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_BASE_NAME + '_' + "{{date:YYYY-MM-DD}}",
        template: getDefaultYAML(format) || '',
        enabled: true,
        format: format,
        excalidraw_export_type: EXPORT_FORMATS_CONSTANTS.DEFAULT_EXCALIDRAW_EXPORT_TYPE,
        excalidraw_png_scale: EXPORT_FORMATS_CONSTANTS.DEFAULT_EXCALIDRAW_PNG_SCALE,
        icon: getDefaultIcon(format) // 根据格式设置默认图标
        };
    
        // 创建对应的资源文件夹
        const styleDirAbs = path.posix.join(
        this.plugin.PLUGIN_ABS_PATH,
        newConfig.style_dir
        );
        if (!fs.existsSync(styleDirAbs)) {
        fs.mkdirSync(styleDirAbs, { recursive: true });
        }
        createFormatAssetStructure(styleDirAbs, format);
        
        debugLog('New export config added:', newConfig.name);
        this.config.exportConfigs.push(newConfig);
    }

    deleteExportFormatItem(exportFormatIndex: number): void {
        const item = this.config.exportConfigs[exportFormatIndex];
        const styleDirAbs = path.posix.join(
            this.plugin.PLUGIN_ABS_PATH,
            item.style_dir
        );
        if (fs.existsSync(styleDirAbs)) {
            fs.rmSync(styleDirAbs, { recursive: true, force: true });
        }
        this.config.exportConfigs.splice(exportFormatIndex, 1);
    }
}