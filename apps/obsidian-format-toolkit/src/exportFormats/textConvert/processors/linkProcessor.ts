import { BaseConverter, AdvancedConverter } from '../textConverter';
import { getHeadingText } from '../../../lib/noteResloveUtils';
import * as path from 'path';
import url from 'url';
import StateBlock from 'markdown-it/lib/rules_block/state_block.mjs';

const OBSIDIAN_LINK = 'obsidian_link';

BaseConverter.registerProcessor({
    name: 'obsidianLinkParserRule',
    formats: ['quarto', 'vuepress', 'typst', 'plain'],
    description: '自定义双链接解析规则',
    // 确保![[...]]前后都有空行，够能被块级规则(block.ruler)识别
    preProcessor: (text: string) => {
        const lines = text.split('\n');
        let i = 0;
        while(i < lines.length){
            const line = lines[i];
            if(line.trim().startsWith('![[') && line.trim().endsWith(']]')){
                const front = (lines[i-1]?.trim()=='')?'':'\n';
                const back = (lines[i+1]?.trim()=='')?'':'\n';
                lines[i] = front + line + back;
            }
            i++;
        }
        return lines.join('\n');
    },
    mditRuleSetup: (converter: BaseConverter) => {
        // 定义双链接的token类型
        obsidianLinkPlugin(converter);
    }
});

BaseConverter.registerProcessor({
    name: 'obsidianLinkRendererRule_typst',
    formats: ['typst'],
    description: '自定义双链接渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules[OBSIDIAN_LINK] = (tokens, idx) => {
            const export_name = tokens[idx].content;
            return `#image("${path.posix.join(converter.attachmentDir, export_name)}", width: 100%)`;
        };
    }
});

BaseConverter.registerProcessor({
    name: 'obsidianLinkRendererRule_quarto',
    formats: ['quarto'],
    description: '自定义双链接渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules[OBSIDIAN_LINK] = (tokens, idx) => {
            const export_name = tokens[idx].content;
            return `![](${path.posix.join(converter.attachmentDir, export_name)})`;
        };
    }
});

BaseConverter.registerProcessor({
    name: 'obsidianLinkRendererRule_plain',
    formats: ['plain'],
    description: '自定义双链接渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules[OBSIDIAN_LINK] = (tokens, idx) => {
            const export_name = tokens[idx].content;
            return `![[${export_name}]]`;
        };
    }
});


// 识别引用类型，对.md进行特殊处理；对于其他文件类型，查找路径并推入数组
// 根据文件名在从当前目录开始逐级查找文件，返回文件路径
async function obsidianLinkPlugin(converter: BaseConverter){
    // 使用block规则替代inline规则
    converter.md.block.ruler.before('fence', OBSIDIAN_LINK, (
        state: StateBlock,
        startLine: number,
        endLine: number,
        silent: boolean
    ): boolean => {
        const pos = state.bMarks[startLine] + state.tShift[startLine];
        const max = state.eMarks[startLine];
        const content = state.src.slice(pos, max);

        // 检查是否包含![[...]]格式的链接
        const linkMatch = content.match(/!\[\[(.*?)\]\]/);
        if (!linkMatch) return false;

        if (silent) return true;


        const linkText = linkMatch[1].split('|'); // 链接文本
        const linkName = linkText[0];

        if(converter instanceof AdvancedConverter ){
        // 获取附件路径和类型
            const linkInfo = converter.getLinkInfo(linkName);
            if (linkInfo.type === 'markdown' && converter.isRecursiveEmbedNote) {
                converter.pushNoteFile(linkInfo.path);
                
                // console.log(converter.getCurrentFile());
                // console.log(linkInfo.headingNames);
                let headingText = getHeadingText(converter.embedNoteCache[linkInfo.path], linkInfo.raw_text.split('#').slice(1));
                // console.log(headingText);
                headingText = converter.preProcess(headingText);// 嵌入笔记的文本需要进行前处理
                // 解析获取到的文本
                state.md.block.parse(
                    headingText,
                    state.md,
                    state.env,
                    state.tokens
                );
                converter.popNoteFile();
            } else {
                // 创建段落token
                const token = state.push('paragraph_open', 'p', 1);
                token.map = [startLine, startLine + 1];

                // 创建链接token
                const linkToken = state.push(OBSIDIAN_LINK, 'a', 0);
                converter.pushLinkToLinks(linkInfo);
                linkToken.content = linkInfo.export_name;
                linkToken.markup = '![[]]';
                linkToken.attrs = [['linkType', linkInfo.type]];
                state.push('paragraph_close', 'p', -1);
            }
        } else {
            const token = state.push('paragraph_open', 'p', 1);
            token.map = [startLine, startLine + 1];
            // 创建链接token
            const linkToken = state.push(OBSIDIAN_LINK, 'a', 0);
            linkToken.content = linkName;
            state.push('paragraph_close', 'p', -1);
        }

        state.line = startLine + 1;
        return true;
    });
}





/**
 * 格式化 markdown-it token 对象为易读的字符串形式，用于调试和开发目的
 * 该函数递归地处理 token 及其子 token，输出包含以下信息：
 * - token 的类型 (type)
 * - token 的内容 (content)
 * - token 的层级 (level)
 * - token 的标签 (tag)
 * - token 的嵌套状态 (nesting)
 * - token 的属性列表 (attrs)
 * - token 的子节点 (children)
 * 
 * @param token - markdown-it token 对象
 * @param level - 缩进层级，用于格式化输出
 * @returns 格式化后的字符串表示
 */
// function formatToken(token: any, level = 0): string {
//     let indent = '  '.repeat(level);
//     let result = `${indent}Token ${token.type}:\n`;
//     indent = '  '.repeat(level + 1);
    
//     // 基本属性
//     result += `${indent}content: "${token.content}"\n`;
//     result += `${indent}level: ${token.level}\n`;
//     result += `${indent}tag: "${token.tag}"\n`;
//     result += `${indent}nesting: ${token.nesting}\n`;
    
//     // 属性列表
//     if (token.attrs && token.attrs.length > 0) {
//         result += `${indent}attrs:\n`;
//         token.attrs.forEach(([key, value]: [string, string]) => {
//             result += `${indent}  ${key}: "${value}"\n`;
//         });
//     }

//     // 子token
//     if (token.children && token.children.length > 0) {
//         result += `${indent}children:\n`;
//         token.children.forEach((child: any) => {
//             result += formatToken(child, level + 2);
//         });
//     }

//     return result;
// }

if (import.meta.url === url.pathToFileURL(process.argv[1]).href){
    // 辅助函数：格式化token输出

    const converter = new BaseConverter();
    const text = `
链接一![[test.png]]
链接二![[page2.png|page2]]
普通文本和*强调*混合\`[[page3.png]]\`
    `;
    
    // const tokens = converter.md.parse(text, {});
    // console.log('Parsed Tokens:');
    // tokens.forEach(token => {
    //     console.log(formatToken(token));
    //     console.log('-------------------');
    // });
    console.log(converter.convert(text));
    // console.log(converter.links);
    // console.log(path.join(__filename))
}