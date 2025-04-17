import type MyPlugin from '../main';
import type { ExcalidrawAutomate } from 'obsidian-excalidraw-plugin';
import { Notice, TFile } from 'obsidian';
import * as fs from 'fs';

/**
 * 导出Excalidraw绘图为PNG格式
 * @param plugin 插件实例
 * @param sourcePathRel 源文件路径(vault相对路径)
 * @param targetPathAbs 目标文件路径(系统绝对路径）
 * @returns Promise<void>
 */
export async function exportToPngAbs(
    plugin: MyPlugin, 
    sourcePathRel: string,
    targetPathAbs: string
): Promise<void> {
    try {
        const excalidrawPlugin = (plugin.app as any).plugins.plugins["obsidian-excalidraw-plugin"];
        const ea = excalidrawPlugin.ea as ExcalidrawAutomate;
        const abstractFile = plugin.app.vault.getAbstractFileByPath(sourcePathRel);
        
        if (!(abstractFile instanceof TFile)) {
            throw new Error("Source file not found or is not a file");
        }
        
        // 设置活动视图并复制元素
        // const excalidrawElements = (await ea.getSceneFromFile(abstractFile)).elements;
        // ea.copyViewElementsToEAforEditing(excalidrawElements);
        
        // 创建PNG blob并保存到文件
        const pngBlob = await ea.createPNG(sourcePathRel,2);
        const arrayBuffer = await pngBlob.arrayBuffer();
        
        // 确保目标目录存在
        // fs.mkdirSync(path.dirname(targetPathAbs), { recursive: true });
        // 使用fs模块保存到系统路径
        fs.writeFileSync(targetPathAbs, Buffer.from(arrayBuffer));
        // 使用vault adapter保存到vault内
        // await plugin.app.vault.adapter.writeBinary(targetPathAbs, arrayBuffer);
        new Notice('导出PNG成功');
    } catch (error) {
        new Notice(`导出失败: ${error.message}`);
        throw error;
    }
}

export async function exportToPngRel(
    plugin: MyPlugin,
    sourcePathRel: string,
    targetPathRel: string
): Promise<void> {
    const targetPathAbs = plugin.getPathAbs(targetPathRel);
    await exportToPngAbs(plugin, sourcePathRel, targetPathAbs);
}



/**
 * TODO: 目前有bug未使用,待修复
 * 导出Excalidraw绘图为SVG格式
 * @param plugin 插件实例
 * @param sourcePath 源文件路径
 * @param targetPath 目标文件路径
 * @returns Promise<void>
 */
export async function exportToSvg(
    plugin: MyPlugin, 
    sourcePath: string,
    targetPath: string
): Promise<void> {
    try {
        const excalidrawPlugin = (plugin.app as any).plugins.plugins["obsidian-excalidraw-plugin"];
        const ea = excalidrawPlugin.ea as ExcalidrawAutomate;
        const abstractFile = plugin.app.vault.getAbstractFileByPath(sourcePath);
        
        if (!(abstractFile instanceof TFile)) {
            throw new Error("Source file not found or is not a file");
        }
        console.log(sourcePath);
        // 创建SVG内容并保存到文件
        const svgElements = await ea.createSVG(sourcePath);
        const svgString = new XMLSerializer().serializeToString(svgElements);// 将 DOM 对象转为 XML 字符串
        // const svgString = svgElements.outerHTML;
        console.log(svgString);
        // if (!svgString.includes("xmlns")) {// 确保包含命名空间（有些浏览器会遗漏）
        //     svgString = svgString.replace(
        //     "<svg",
        //     '<svg xmlns="http://www.w3.org/2000/svg"'
        //     );
        // }
        await plugin.app.vault.create(targetPath, svgString);
        
        new Notice('导出SVG成功');
    } catch (error) {
        new Notice(`导出失败: ${error.message}`);
        throw error;
    }
}

/**
 * 检查Excalidraw插件是否已安装
 * @param plugin 插件实例
 * @returns boolean
 */
export function isExcalidrawInstalled(plugin: MyPlugin): boolean {
    return !!(plugin.app as any).plugins.plugins["obsidian-excalidraw-plugin"];
}

/**
 * 检查Excalidraw插件是否已完全加载
 * @param plugin 插件实例
 * @returns boolean
 */
export function isExcalidrawLoaded(plugin: MyPlugin): boolean {
    const excalidrawPlugin = (plugin.app as any).plugins.plugins["obsidian-excalidraw-plugin"];
    return !!(excalidrawPlugin && excalidrawPlugin.ea);
}
