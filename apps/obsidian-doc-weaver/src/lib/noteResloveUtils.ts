import { TFile, Notice, CachedMetadata, HeadingCache} from "obsidian";
import type DocWeaver from "../main";

export interface NoteInfo {
    path: string;
    file: TFile;
    text: string;
    mainContent: string;
    cachedMetadata: CachedMetadata;
}

export function getHeadingText (noteInfo: NoteInfo, headingNames: string[]): string {
    if (headingNames.length === 0) {
        return noteInfo.mainContent;
    }
    const headingRange = findHeadingRange(noteInfo.cachedMetadata.headings, headingNames);
    if (headingRange) {
        return noteInfo.text.slice(headingRange.start, headingRange.end);
    } else {
        new Notice("Failed to find heading range in Note: " + noteInfo.file.name);
        return "";
    }
}

// export async function getHeadingText_old(plugin: MyPlugin, file: TFile, headingNames: string[]): Promise<string> {
//     const noteText = await plugin.app.vault.read(file);
//     const headingInfo = plugin.app.metadataCache.getFileCache(file)?.headings;
//     if (headingNames.length === 0) {
//         return (await getNoteInfo(plugin, file)).mainContent;
//     }
//     const headingRange = findHeadingRange(headingInfo, headingNames);
//     if (headingRange) {
//         return noteText.slice(headingRange.start, headingRange.end);
//     } else {
//         new Notice("Failed to find heading range in Note: " + file.name);
//         return "";
//     }
// }

/**
 * 在heading数组中查找指定标题序列的范围
 * @param headingInfo - heading信息数组
 * @param headingNames - 要查找的标题名称数组，按层级顺序排列
 * @returns 最后一个匹配标题的范围（开始offset到下一个同级或更高级标题的offset），如果未找到则返回null
 */
export function findHeadingRange(headingInfo: HeadingCache[] | undefined, headingNames: string[]): { start: number, end: number } | null {
    if (!headingInfo) {
        return null;
    }
    let currentIndex = 0;
    let lastMatchedIndex = -1;
    let lastMatchedLevel: number | null = null; // 记录上一个匹配标题的级别，等待第一个匹配来设置基准

    // 依次匹配每个目标标题
    for (const headingName of headingNames) {
        let found = false;
        
        // 从上一个匹配位置开始向后查找
        for (let i = currentIndex; i < headingInfo.length; i++) {
            const heading = headingInfo[i];
            
            // 对于第一个标题，任何级别都可以匹配(level 1-6)
            // 对于后续标题，只要比前一个匹配的标题级别更低即可（level数字更大）
            if (heading.heading === headingName && 
                (lastMatchedLevel === null || heading.level > lastMatchedLevel)) {
                found = true;
                lastMatchedIndex = i;
                currentIndex = i + 1;
                // 记录当前标题的级别，下一个标题需要比这个级别更低
                if (lastMatchedLevel === null) {
                    lastMatchedLevel = heading.level;
                } else {
                    lastMatchedLevel = heading.level;
                }
                break;
            }
        }
        
        if (!found) {
            return null;
        }
    }

    // 如果成功匹配了所有标题
    if (lastMatchedIndex !== -1) {
        const matchedHeading = headingInfo[lastMatchedIndex];
        const matchedLevel = matchedHeading.level;
        let endOffset = Infinity;

        // 查找下一个同级或更高级的标题
        for (let i = lastMatchedIndex + 1; i < headingInfo.length; i++) {
            if (headingInfo[i].level <= matchedLevel) {
                endOffset = headingInfo[i].position.start.offset;
                break;
            }
        }

        return {
            start: matchedHeading.position.start.offset,
            end: endOffset
        };
    }

    return null;
}

export async function getNoteInfo(plugin: DocWeaver, noteFile: TFile): Promise<NoteInfo>{
    const noteText = await plugin.app.vault.read(noteFile) as string;
    const noteCachedMetadata = plugin.app.metadataCache.getFileCache(noteFile) as CachedMetadata;
    let noteMainContent:string;
    if (noteCachedMetadata.frontmatterPosition){
        noteMainContent = noteText.slice(noteCachedMetadata.frontmatterPosition.end.offset + 1);
    }
    else{
        noteMainContent = noteText;
    }
    return {
        path: noteFile.path,
        file: noteFile,
        text: noteText,
        mainContent: noteMainContent,
        cachedMetadata: noteCachedMetadata
    }
}