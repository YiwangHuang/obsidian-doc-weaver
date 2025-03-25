import { RegStore } from "./Reg";

// TODO: 参考callout块处理重构

interface selectTextInfo {
    from_line: number,// 替换范围
    to_line: number,  // .
    header: string,   // 头部信息
    // selector: string, // 选择器（范围选择方式）
    levelFlag: string,// (用来判断code符号或heading层级的)
    content: string,  // 内容信息
    prefix: string,
  }

/**
 * 解析单个容器块的头部信息
 * @param list_text - 文本行数组
 * @param from_line - 开始解析的行号
 * @param header_reg - 用于匹配头部的正则表达式
 * @returns selectTextInfo | null - 返回解析后的容器信息，如果不匹配则返回null
 */
function easySelector_headtail(
    list_text: string[],
    from_line: number,
    header_reg: RegExp
): selectTextInfo | null {
    const mdRange: selectTextInfo = {
        from_line: from_line,
        to_line: from_line + 1,
        header: "",
        content: "",
        prefix: "",
        levelFlag: ""
    }
    if (from_line < 0) return null
    // 匹配第一行
    const first_line_match = list_text[from_line].match(header_reg)
    if (!first_line_match) return null
    mdRange.prefix = first_line_match[1]  // 可以是空
    // 验证header
    mdRange.levelFlag = first_line_match[3]
    mdRange.header = first_line_match[4]
    return mdRange
}

/**
 * 选择并解析指定类型的容器块
 * @param list_text - 文本行数组
 * @param from_line - 开始解析的行号
 * @param typeName - 要匹配的容器类型名称 TODO: 加入level来找同级头尾围栏（兼容嵌套语法）
 * @returns selectTextInfo | null - 返回解析后的容器信息，如果不匹配则返回null
 * 
 * 示例：
 * :::test
 * content
 * :::
 * typeName为"test"时会匹配上述容器
 */
export function selectMditBlock(
    list_text: string[],
    from_line: number,
    typeName: string
): selectTextInfo | null {
    // 解析头部信息
    const mdRangeTemp = easySelector_headtail(list_text, from_line, RegStore.reg_mdit_head)
    if (!mdRangeTemp) return null
    // 验证容器类型是否匹配
    if (!mdRangeTemp.header.trim().startsWith(typeName)) return null
    
    const mdRange = mdRangeTemp
    let level = 0
    let last_nonempty: number = from_line
    
    // 查找容器结束位置
    for (let i = from_line + 1; i < list_text.length; i++) {
        const line = list_text[i]
        // 检查前缀是否匹配
        if (line.indexOf(mdRange.prefix) != 0) break
        const line2 = line.replace(mdRange.prefix, "")    // 删掉无用前缀
        // 跳过空行
        if (RegStore.reg_emptyline_noprefix.test(line2)) { continue }
        last_nonempty = i
        // 找到结束标记
        if (RegStore.reg_mdit_head_noprefix.test(line2) && 
        line2.match(RegStore.reg_mdit_head_noprefix)?.[4].trim()) {
            level++;
            continue;
        }
        if (RegStore.reg_mdit_tail_noprefix.test(line2)) {
            if (level === 0) break;
            level--;
            continue;
        }
    }
    
    // 设置结束位置和提取内容
    mdRange.to_line = last_nonempty + 1
    mdRange.content = list_text
        .slice(from_line + 1, mdRange.to_line - 1)
        .map((line) => { return line.replace(mdRange.prefix, "") })
        .join("\n")
    return mdRange
}

/**
 * 将文本按指定类型的容器分割
 * @param list_text - 文本行数组
 * @param typeName - 要匹配的容器类型名称 
 * @returns (string | selectTextInfo)[] - 返回分割后的结果数组
 *                                       数组元素可能是普通文本行或容器信息对象
 * TODO: 改成同时处理多个容器类型
 * 示例输入：
 * line1
 * :::test
 * content
 * :::
 * line2
 * 
 * 示例输出：
 * ["line1", {容器信息对象}, "line2"]
 */
export function splitTextByMditBlock(
    list_text: string[],
    typeName: string
): (string | selectTextInfo)[] {
    const result: (string | selectTextInfo)[] = []
    // 遍历所有行
    for (let i = 0; i < list_text.length; i++) {
        // 尝试从当前行解析容器
        const mdRange = selectMditBlock(list_text, i, typeName)
        if (mdRange) {
            // 找到容器，添加到结果中
            result.push(mdRange)
            // 跳过已处理的行
            i = mdRange.to_line - 1
        } else {
            // 未找到容器，作为普通文本行处理
            result.push(list_text[i])
        }
    }
    return result
}

export function convertMditToQmd_col(text: string): string {
    const list_text = splitTextByMditBlock(text.split("\n"),"col")
    const list_text_new: string[] = []
    for (const item of list_text) {
        if(typeof item === "string") {
            list_text_new.push(item)
        } else {
            const widthMatch = item.header.match(/width\s*\(((?:\d*\.?\d+(?:%)?,\s*)*\d*\.?\d+(?:%)?)\)/)
            if(!widthMatch) {list_text_new.push(item.content);console.log('col match error');continue}
            // 默认单位是 %
            const widthArgs = widthMatch[1].split(",").map(arg => 
                /^\d*\.?\d+$/.test(arg.trim()) ? `${arg.trim()}%` : arg.trim()
            )
            const columns = item.content.trim().split(/@\s*col/).map(col => col.trim()).slice(1);
            console.log(columns)
            let text_new = `:::: {.columns}\n`
            for(let i = 0;i<Math.min(columns.length,widthArgs.length);i++) {
            text_new += `::: {.column width="${widthArgs[i]}"}\n${columns[i]}\n:::\n`
            }
            text_new += `::::`
            list_text_new.push(text_new)
        }
    }
    return list_text_new.join("\n")
}

export function convertMditToQmd_tab(text: string): string {
    const list_text = splitTextByMditBlock(text.split("\n"),"tab")
    const list_text_new: string[] = []
    for (const item of list_text) {
        if(typeof item === "string") {
            list_text_new.push(item)
        } else {
            const tabs = item.content.trim().split(/@\s*tab/).map(tab => tab.trim()).slice(1);
            let text_new = `:::: {.tabs}\n`
            for(let i = 0;i<tabs.length;i++) {
                text_new += `::: {.tab}\n${tabs[i]}\n:::\n`
            }
            text_new += `::::`
            list_text_new.push(text_new)
        }
    }
    return list_text_new.join("\n")
}


export interface TextMatch {
    text: string;
    matches: string[];
}

type TextSegments = (string | TextMatch)[];

export function splitTextByMatches(text: string, regex: RegExp): TextSegments {
    const segments: TextSegments = [];
    let lastIndex = 0; // 记录上一次匹配结束的位置
    
    // 使用 RegExp.exec() 来迭代所有匹配项
    let match: RegExpExecArray | null;
    // 确保正则表达式有全局标志，否则会导致死循环
    const globalRegex = new RegExp(regex.source, regex.flags + (regex.global ? '' : 'g'));
    
    while ((match = globalRegex.exec(text)) !== null) {
        // 如果匹配位置前有未匹配的文本，将其添加到segments
        if (match.index > lastIndex) {
            segments.push(text.slice(lastIndex, match.index));
        }
        
        // 将匹配项添加为TextMatch对象
        segments.push({
            text: match[0],
            matches: match.slice(0) // 包含完整匹配和所有捕获组
        });
        
        lastIndex = globalRegex.lastIndex;
    }
    
    // 处理最后一个匹配之后的剩余文本
    if (lastIndex < text.length) {
        segments.push(text.slice(lastIndex));
    }
    
    return segments;
}