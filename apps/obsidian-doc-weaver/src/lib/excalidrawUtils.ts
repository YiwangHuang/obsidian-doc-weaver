import type DocWeaver from '../main';
import ExcalidrawPlugin from 'obsidian-excalidraw-plugin';
import { Notice, TFile } from 'obsidian';
import { logger } from './debugUtils';
import * as fs from 'fs';

// TODO: 增加参数，控制输出的PNG或SVG的背景色，可选透明

/**
 * 导出Excalidraw绘图为PNG格式
 * @param plugin 插件实例
 * @param sourcePathRel 源文件路径(vault相对路径)
 * @param targetPathAbs 目标文件路径(系统绝对路径）
 * @returns Promise<void>
 */
export async function exportToPng(
    plugin: DocWeaver, 
    sourcePathRel: string,
    targetPathAbs: string,
    scale?: number
): Promise<void> {
    try {
        const excalidrawPlugin = plugin.app.plugins.plugins["obsidian-excalidraw-plugin"] as ExcalidrawPlugin;
        const ea = excalidrawPlugin.ea;
        const abstractFile = plugin.app.vault.getAbstractFileByPath(sourcePathRel); 
        
        if (!(abstractFile instanceof TFile)) {
            throw new Error("Source file not found or is not a file");
        }
        
        // 设置活动视图并复制元素
        // const excalidrawElements = (await ea.getSceneFromFile(abstractFile)).elements;
        // ea.copyViewElementsToEAforEditing(excalidrawElements);
        
        // 创建PNG blob并保存到文件
        const pngBlob = await ea.createPNG(sourcePathRel,scale = scale || 2); // scale默认值为2
        const arrayBuffer = await pngBlob.arrayBuffer();
        
        // 使用fs模块保存到系统路径
        fs.writeFileSync(targetPathAbs, Buffer.from(arrayBuffer));

    } catch (error) {
        new Notice(`export to PNG failed: ${error.message}`);
        throw error;
    }
}

/**
 * 导出Excalidraw绘图为SVG格式
 * @param plugin 插件实例
 * @param sourcePathRel 源文件路径(vault相对路径)
 * @param targetPathAbs 目标文件路径(系统绝对路径)
 * @returns Promise<void>
 */
export async function exportToSvg(
    plugin: DocWeaver, 
    sourcePathRel: string,
    targetPathAbs: string
): Promise<void> {
    try {
        const excalidrawPlugin = plugin.app.plugins.plugins["obsidian-excalidraw-plugin"] as ExcalidrawPlugin;
        const ea = excalidrawPlugin.ea;
        const abstractFile = plugin.app.vault.getAbstractFileByPath(sourcePathRel);
        
        if (!(abstractFile instanceof TFile)) {
            throw new Error("Source file not found or is not a file");
        }
        logger.debug(`sourcePath: ${sourcePathRel}`);
        // 创建SVG内容并保存到文件
        const svgElements = await ea.createSVG(sourcePathRel);
        const svgString = svgElements.outerHTML;
        // console.log(svgString);
        // if (!svgString.includes("xmlns")) {// 确保包含命名空间（有些浏览器会遗漏）
        //     svgString = svgString.replace(
        //     "<svg",
        //     '<svg xmlns="http://www.w3.org/2000/svg"'
        //     );
        // }
        fs.writeFileSync(targetPathAbs, svgString);
        new Notice('导出SVG成功');
    } catch (error) {
        new Notice(`导出失败: ${error.message}`);
        throw error;
    }
}

/**
 * 判断笔记是否属于excalidraw文件
 * @param plugin 插件实例
 * @param noteFile 笔记文件对象
 * @returns 是否属于excalidraw文件
 */
export function isExcalidrawNote(plugin: DocWeaver, noteFile: TFile): boolean {
    return plugin.app.metadataCache.getFileCache(noteFile)?.frontmatter?.['excalidraw-plugin'] === 'parsed';
}

/**
 * 检查Excalidraw插件是否已安装
 * @param plugin 插件实例
 * @returns boolean
 */
export function isExcalidrawInstalled(plugin: DocWeaver): boolean {
    return !!plugin.app.plugins.plugins["obsidian-excalidraw-plugin"];
}

/**
 * 检查Excalidraw插件是否已完全加载
 * @param plugin 插件实例
 * @returns boolean
 */
export function isExcalidrawLoaded(plugin: DocWeaver): boolean {
    const excalidrawPlugin = plugin.app.plugins.plugins["obsidian-excalidraw-plugin"] as ExcalidrawPlugin;
    return !!excalidrawPlugin.ea;
}
