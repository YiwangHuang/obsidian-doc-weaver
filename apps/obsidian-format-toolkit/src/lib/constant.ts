import moment from 'moment';
/**
 * 将形如 ${date: YYYY-MM-DD} 的占位符转换为实际日期字符串
 * @param template - 包含占位符的字符串
 * @returns 转换后的字符串
 */
export function replaceDatePlaceholders(template: string): string {
    const dateRegex = /{{date:\s*([^}]+)}}/g;

    return template.replace(dateRegex, (matchedPattern, dateFormat) => {
        return moment().format(dateFormat.trim());
    });
}

// 使用示例
// const templateString = "Today's date is ${date: YYYY-MM-DD}.";
// const result = replacePlaceholders(templateString);
// console.log(result); // 输出: Today's date is 2024-02-20. (假设今天是2024年2月20日)

// 变量占位符
export const VAR_DATE = "{{date: YYYY-MM-DD}}";      // 日期
export const VAR_VAULT_DIR = "{{vaultDir}}";         // 仓库目录
export const VAR_NOTE_DIR = "{{noteDir}}";          // 笔记所在目录
export const VAR_NOTE_NAME = "{{noteName}}";         // 笔记名称
export const VAR_FORMAT = "{{format}}";              // 导出格式
// export const VAR_PARENT_DIR = "${parent}";          // 父目录
// export const VAR_ORIGINAL_NAME = "${originalname}";  // 原始文件名
// export const VAR_EXTENSION = "${extension}";         // 文件扩展名
// export const VAR_MD5 = "${md5}";                    // MD5值

// 导出位置类型
export const LOCATION_OBS_FOLDER = "obsFolder";      // Obsidian文件夹
export const LOCATION_IN_FOLDER = "inFolderBelow";   // 子文件夹内
export const LOCATION_NEXT_TO_NOTE = "nextToNote";   // 笔记旁边