import { Editor, EditorPosition, MarkdownView, Command } from "obsidian";
import type MyPlugin from "../main";
import { TagConfig, TagWrapperSettings, tagWrapperSetting } from "./settings";

// 根据设置依次添加标签命令
export function addGetTagWrapperCommands(plugin: MyPlugin): void {
    const settings = plugin.settingList[tagWrapperSetting.name] as TagWrapperSettings;
    settings.tags
        .filter(tag => tag.enabled)
        .forEach(tag => plugin.addCommand(createTagWrapperCommand(plugin, tag)));
}

export function createTagWrapperCommand(plugin: MyPlugin, tagConfig: TagConfig): Command {
    return {
        id: tagConfig.id,
        name: tagConfig.name,
        editorCallback: (editor: Editor, view: MarkdownView) => 
            wrapper(editor, view, tagConfig.prefix, tagConfig.suffix)
    };
}

function wrapper(editor: Editor, view: MarkdownView, prefix: string, suffix: string): void {
    // 存储前缀和后缀的长度，用于后续计算位置
    const PL = prefix.length; // Prefix Length
    const SL = suffix.length; // Suffix Length
    // 获取当前选中的文本，如果没有选中则返回空字符串
    const selectedText = editor.somethingSelected() ? editor.getSelection() : "";

    // 获取文档最后位置的游标
    const last_cursor = editor.getCursor();
    last_cursor.line = editor.lastLine();                              // 设置为最后一行
    last_cursor.ch = editor.getLine(last_cursor.line).length;         // 设置为该行最后一个字符
    const last_offset = editor.posToOffset(last_cursor);              // 将位置转换为偏移量

    // 辅助函数：将偏移量转换为编辑器位置，并处理边界情况
    function Cursor(offset: number): EditorPosition {
        if (offset > last_offset) {                                   // 如果偏移量超过文档末尾
            return last_cursor;                                       // 返回最后位置
        }
        offset = offset < 0 ? 0 : offset;                            // 如果偏移量小于0，设为0
        return editor.offsetToPos(offset);                           // 将偏移量转换为位置对象
    }

    // 获取选择的起始和结束位置的偏移量
    const fos = editor.posToOffset(editor.getCursor("from"));        // 选择起始位置的偏移量
    const tos = editor.posToOffset(editor.getCursor("to"));          // 选择结束位置的偏移量
    const len = selectedText.length;                                 // 选中文本的长度

    // 检查选中文本周围的标签
    // 检查是否完整选中了带标签的文本
    const beforeText = editor.getRange(Cursor(fos - PL), Cursor(tos - len));    // 选中文本前的内容
    const afterText = editor.getRange(Cursor(fos + len), Cursor(tos + SL));
    // 检查选中文本的开始和结束位置是否刚好是标签
    const startText = editor.getRange(Cursor(fos), Cursor(fos + PL));           // 选中文本开始处的内容
    const endText = editor.getRange(Cursor(tos - SL), Cursor(tos));             // 选中文本结束处的内容

    if (beforeText === prefix && afterText === suffix) {
        // 情况1：完整选中了带标签的文本，需要移除标签
        editor.setSelection(Cursor(fos - PL), Cursor(tos + SL));              // 选中包含标签的整个范围
        editor.replaceSelection(`${selectedText}`);                           // 替换为不带标签的文本
        editor.setSelection(Cursor(fos - PL), Cursor(tos - PL));             // 重新选中文本

    } else if (startText === prefix && endText === suffix) {
        // 情况2：选中了标签内的文本，需要移除标签
        editor.replaceSelection(
            editor.getRange(Cursor(fos + PL), Cursor(tos - SL))              // 获取不带标签的文本
        );
        editor.setSelection(Cursor(fos), Cursor(tos - PL - SL));             // 重新选中文本

    } else {
        // 情况3：需要添加标签
        if (selectedText) {
            // 有选中文本：在选中文本两端添加标签
            editor.replaceSelection(`${prefix}${selectedText}${suffix}`);
            // 重新选中原文本（不含标签）
            editor.setSelection(
                editor.offsetToPos(fos + PL),
                editor.offsetToPos(tos + PL)
            );
        } else {
            // 没有选中文本：插入空标签对
            editor.replaceSelection(`${prefix}${suffix}`);
            // 将光标移动到标签对中间
            const cursor = editor.getCursor();
            cursor.ch -= SL;
            editor.setCursor(cursor);
        }
    }
}
