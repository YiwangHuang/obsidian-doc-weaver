import type MarkdownIt from 'markdown-it';
import type { Token } from 'markdown-it';
// import StateBlock from 'markdown-it/lib/rules_block/state_block.mjs';
import { BaseConverter } from '../textConverter';
import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";



BaseConverter.registerProcessor({
    name: 'calloutParseRule',
    formats: ['quarto','typst', 'vuepress'],
    description: '解析 Callout 语法',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.use(calloutPlugin);
    }
});



// BaseConverter.registerProcessor({
//     name: 'calloutParseRule_vuepress',
//     formats: ['vuepress',],
//     description: '解析 Callout 语法', 
//     mditRuleSetup: (converter: BaseConverter) => {
//         converter.md.disable(['blockquote']);
//     },
//     postProcessor: (text: string, converter: BaseConverter) => {
//         return text.replace(/&gt;/g, '>'); // TODO: 暂时解决办法：用后置处理器替换&gt;为>
//     }
// });

BaseConverter.registerProcessor({
    name: 'calloutRenderRule_typst',
    formats: ['typst'],
    description: '自定义 callout 渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.callout_open = (tokens, idx) => {
            const token = tokens[idx];
            const calloutType = token.attrGet('callout-type');
            const calloutFold = token.attrGet('callout-fold');
            const calloutTitle = token.attrGet('callout-title');
            return `#callout(
type: "${calloutType}",
${calloutFold !== '' ? `collapse: ${calloutFold === '-'},` : ''}
${calloutTitle ? `title: [${converter.md.renderInline(calloutTitle)}],` : ''}
[\n`;
        };
        converter.md.renderer.rules.callout_close = () => {
            return ']\n)\n';
        }
    }
});

BaseConverter.registerProcessor({
    name: 'calloutRenderRule_vuepress',
    formats: ['vuepress'],
    description: 'html + markdown 混编文件中需要确保paragraph块前的空行',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.blockquote_open = (tokens, idx, options, env, self) => {
            return self.renderToken(tokens, idx, options) + '\n';
        };
        converter.md.renderer.rules.blockquote_close = (tokens, idx, options, env, self) => {
            return self.renderToken(tokens, idx, options) + '\n';
        };
        converter.md.renderer.rules.callout_open = (tokens, idx, options, env, self) => {
            const token = tokens[idx];
            const calloutType = token.attrGet('callout-type');
            const calloutFold = token.attrGet('callout-fold');
            const calloutTitle = token.attrGet('callout-title');
            if (calloutFold === '+' || calloutFold === '-') {
                return `<details class="callout" callout-type="${calloutType}" ${calloutFold === '+' ? 'open' : ''}>
<summary class="callout-title">\n\n${calloutTitle}\n\n</summary>\n<div class="callout-content">\n\n`;
            } else {
                return `<blockquote class="callout" callout-type="${calloutType}">\n<div class="callout-title">\n\n${calloutTitle}\n\n</div>\n<div class="callout-content">\n\n`;
            }
        };    
        converter.md.renderer.rules.callout_close = (tokens, idx, options, env, self) => {
            const token = tokens[idx];
            const calloutFold = token.attrGet('callout-fold');
            if (calloutFold === '+' || calloutFold === '-') {
                return '\n</div>\n</details>\n\n';
            } else {
                return '\n</div>\n</blockquote>\n\n';
            }
        };
    }
});

// BaseConverter.registerProcessor({
//     name: 'calloutRenderRule_quarto',
//     formats: ['quarto'],
//     mditRuleSetup: (converter: BaseConverter) => {
//         converter.md.renderer.rules.callout_open = (tokens, idx) => {
//             const token = tokens[idx];
//             const attrs = token.meta as CalloutAttributes;
            
//             return `\n::: {.callout-${attrs.type} ${attrs.title ? `title="${converter.md.renderInline(attrs.title)}"` : ''} ${attrs.collapse === undefined ? '' : `collapse="${attrs.collapse}"`}}\n`;
//         };
//         converter.md.renderer.rules.callout_close = () => {
//             return ':::\n';
//         };
//     }
// });

// 定义支持的 callout 类型
const CALLOUT_TYPES = [
    'abstract',
    'tldr',
    'summary',
    'bug',
    'danger',
    'error',
    'done',
    'example',
    'failure',
    'missing',
    'info',
    'note',
    'question',
    'help',
    'quote',
    'success',
    'check',
    'tip',
    'hint',
    'important',
    'todo',
    'warning',
    'caution',
    'attention',
];


// 用于验证 callout 标记的正则表达式，支持 collapse 和 title
// 格式：[!type][(+|-)][ title]
// const CALLOUT_MARKER_REGEX = /^\[!(.*?)\]([+-])?(?:\s+(.*))?$/;



function calloutPlugin(md: MarkdownIt) {
    md.core.ruler.after("block", "obsidian-callouts", (state) => {
        const tokens = state.tokens;
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.type === "blockquote_open") {
                inspectBlockquoteContent(tokens, i);
            }
        }
    });
    md.block.ruler.before('fence', 'callout_container', getCalloutContainerRule(), {
        alt: ["paragraph", "reference", "blockquote", "list"],
    });
}




const QUOTE_CALLOUT_REXGEX = /^\[!([^\]]+)\](\+|-|) *(.*)? */;

// 容器语法的正则表达式，匹配 tip+ title 格式（已去除开头的:::）
const CONTAINER_CALLOUT_REGEX = /^\s*([a-zA-Z]+)([+-]?)\s*(.*)?$/;

/**
 * 创建容器 callout 规则解析器
 * @returns RuleBlock - markdown-it的块级规则函数
 */
const getCalloutContainerRule = (): RuleBlock => (state, startLine, endLine, silent) => {
    // 获取当前行的起始和结束位置
    let start = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    // 快速检查第一个字符，过滤掉大多数非容器块
    if (state.src[start] !== ":") return false;
    let pos = start + 1;

    // 检查标记字符串的其余部分（连续的冒号）
    while (pos <= max) {
        if (state.src[pos] !== ":") break;
        pos++;
    }

    const markerCount = pos - start;

    // 标记至少需要3个冒号
    if (markerCount < 3) return false;

    // 提取标记和参数
    const markup = state.src.slice(start, pos);
    const params = state.src.slice(pos, max).trim();

    // 解析容器参数
    const match = params.match(CONTAINER_CALLOUT_REGEX);
    if (!match) return false;

    // const [, calloutType, foldIndicator, title] = match;
    const calloutType = match[1].toLowerCase();
    const foldIndicator = match[2];
    const title = match[3]?.trim();
    
    // 验证 callout 类型是否支持
    if (!CALLOUT_TYPES.includes(calloutType)) return false;

    // 如果处于静默模式（只验证语法），找到开始标记就返回true
    if (silent) return true;

    let nextLine = startLine;
    let autoClosed = false;

    // 搜索块的结束位置
    while (nextLine < endLine) {
        nextLine++;
        start = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];

        // 如果遇到负缩进的非空行，应该停止列表
        if (start < max && state.sCount[nextLine] < state.blkIndent) break;

        if (
            // 匹配开始字符":"
            state.src[start] === ":" &&
            // 结束围栏的缩进应该少于4个空格
            state.sCount[nextLine] - state.blkIndent < 4
        ) {
            // 检查标记的其余部分
            for (pos = start + 1; pos <= max; pos++)
                if (state.src[pos] !== ":") break;

            // 结束围栏必须至少与开始围栏一样长
            if (pos - start >= markerCount) {
                // 确保后面只有空格
                pos = state.skipSpaces(pos);

                if (pos >= max) {
                    // 找到了！
                    autoClosed = true;
                    break;
                }
            }
        }
    }

    // 保存当前状态，以便稍后恢复
    const oldParent = state.parentType;
    const oldLineMax = state.lineMax;

    // 设置新的父类型
    // @ts-expect-error: 我们正在创建一个名为"callout_container"的新类型
    state.parentType = 'callout_container';

    // 这将防止延迟续行超出我们的结束标记
    state.lineMax = nextLine - (autoClosed ? 1 : 0);

    // 创建开始token，参照 inspectBlockquoteContent 的格式
    const openToken = state.push('callout_open', 'blockquote', 1); // 标签用blockquote，跟 inspectBlockquoteContent 的格式一致
    openToken.markup = markup;
    openToken.block = true;
    openToken.attrPush(['class', 'callout']);
    openToken.attrPush(['callout-type', calloutType]);
    openToken.attrPush(['callout-fold', foldIndicator || '']);
    if (title && title !== '') {
        openToken.attrPush(['callout-title', title]);
    } else {
        openToken.attrPush(['callout-title', calloutType.charAt(0).toUpperCase() + calloutType.slice(1)]);
    }
    openToken.map = [startLine, nextLine - (autoClosed ? 1 : 0)];

    // 递归解析容器内的内容
    state.md.block.tokenize(
        state,
        startLine + 1,
        nextLine - (autoClosed ? 1 : 0)
    );

    // 创建结束token，参照 inspectBlockquoteContent 的格式
    const closeToken = state.push('callout_close', 'blockquote', -1); // 标签用blockquote，跟 inspectBlockquoteContent 的格式一致
    closeToken.markup = state.src.slice(start, pos);
    closeToken.block = true;
    closeToken.attrPush(['callout-type', calloutType]);
    closeToken.attrPush(['callout-fold', foldIndicator || '']);

    // 恢复解析器状态
    state.parentType = oldParent;
    state.lineMax = oldLineMax;
    state.line = nextLine + (autoClosed ? 1 : 0);

    return true;
};

export function inspectBlockquoteContent(iterable: Token[], startIdx: number) {
    let content = "";
    let blockquoteDepth = 0;
    let endIdx = startIdx;
    let contentIdx = startIdx;

    // Iterate over the tokens starting from startIdx
    for (let i = startIdx; i < iterable.length; i++) {
        const token = iterable[i];

        if (token.type === "blockquote_open") {
            blockquoteDepth++;
        } else if (token.type === "blockquote_close") {
            endIdx = i;
            blockquoteDepth--;
        }

        // TODO: with rule, nested blockquotes may never be a thing
        if (blockquoteDepth === 0) {
            break;
        } else if (blockquoteDepth > 1) {
            continue;
        }

        if (token.type === "inline") {
            if (contentIdx === startIdx && token.content.match(QUOTE_CALLOUT_REXGEX)) {
                contentIdx = i;
            }
            // If the token is a text token, append its content to content
            content = content + token.content;
        } else if (token.type === "paragraph_close") {
            // If the token is a paragraph_close token, append a newline to content
            content += "\n";
        }
    }

    const match = content.match(QUOTE_CALLOUT_REXGEX);
    if (match && startIdx !== endIdx) {
        const calloutType = match[1].toLowerCase();
        const calloutFold = match[2];
        const calloutTitle = match[3]?.trim();

        iterable[startIdx].type = "callout_open";
        iterable[startIdx].attrPush(["class", "callout"]);
        iterable[startIdx].attrPush(["callout-type", calloutType]);
        iterable[startIdx].attrPush(["callout-fold", calloutFold]);
        if (calloutTitle && calloutTitle !== '') {
            iterable[startIdx].attrPush(["callout-title", calloutTitle]);
        } else {
            iterable[startIdx].attrPush(["callout-title", calloutType.charAt(0).toUpperCase() + calloutType.slice(1)]);
        }

        iterable[endIdx].type = "callout_close";
        iterable[endIdx].attrPush(["callout-type", calloutType]);
        iterable[endIdx].attrPush(["callout-fold", calloutFold]);

        if (
            contentIdx !== startIdx &&
            iterable[contentIdx] &&
            iterable[contentIdx].children
        ) {
            iterable[contentIdx].content = iterable[contentIdx].content
                .replace(QUOTE_CALLOUT_REXGEX, "")
                .trim();
        }
    }
}



// 测试用例注释（已移除实际测试变量）
/*
测试文本示例：
::: tip+ 这是一个带标题的可折叠信息块

这是一个信息块

第二行内容
- 列表项1  
- 列表项2

### 三级标题
第三行*内容*

:::

::: warning- 这是一个带标题的不可折叠警告块
警告内容
:::

::: note
普通提示块
:::
*/

