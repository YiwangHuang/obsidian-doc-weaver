import MarkdownIt from 'markdown-it';
import StateBlock from 'markdown-it/lib/rules_block/state_block.mjs';
import { BaseConverter } from '../textConverter';
// import * as url from 'url';



BaseConverter.registerProcessor({
    name: 'calloutParseRule',
    formats: ['quarto','typst'],
    description: '解析 Callout 语法',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.use(calloutPlugin);
    }
});

BaseConverter.registerProcessor({
    name: 'calloutParseRule_HMD',
    formats: ['HMD',],
    description: '解析 Callout 语法', 
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.disable(['blockquote']);
    },
    postProcessor: (text: string, converter: BaseConverter) => {
        return text.replace(/&gt;/g, '>'); // TODO: 暂时解决办法：用后置处理器替换&gt;为>
    }
});

BaseConverter.registerProcessor({
    name: 'calloutRenderRule_typst',
    formats: ['typst'],
    description: '自定义 callout 渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.callout_open = (tokens, idx) => {
            const token = tokens[idx];
            const attrs = token.meta as CalloutAttributes;            
            return `
#callout(
type: "${attrs.type}",
${attrs.collapse ? 'collapse: true' : 'collapse: false'},
${attrs.title ? `title: [${converter.md.renderInline(attrs.title)}],` : ''}
[\n`;
        };
        converter.md.renderer.rules.callout_close = () => {
            return ']\n)\n';
        };
    }
});

BaseConverter.registerProcessor({
    name: 'calloutRenderRule_quarto',
    formats: ['quarto'],
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.callout_open = (tokens, idx) => {
            const token = tokens[idx];
            const attrs = token.meta as CalloutAttributes;
            
            return `\n::: {.callout-${attrs.type} ${attrs.title ? `title="${converter.md.renderInline(attrs.title)}"` : ''} ${attrs.collapse === undefined ? '' : `collapse="${attrs.collapse}"`}}\n`;
        };
        converter.md.renderer.rules.callout_close = () => {
            return ':::\n';
        };
    }
});

// 定义支持的 callout 类型
const CALLOUT_TYPES = [
    'note',
    'info',
    'warning',
    'danger',
    'tip',
    'important',
    'todo',
    'done',
    'question'
] as const;

type CalloutType = typeof CALLOUT_TYPES[number];

// 用于验证 callout 标记的正则表达式，支持 collapse 和 title
// 格式：[!type][(+|-)][ title]
const CALLOUT_MARKER_REGEX = /^\[!(.*?)\]([+-])?(?:\s+(.*))?$/;

interface CalloutAttributes {
    type: CalloutType;
    collapse?: boolean;
    title?: string;
}

function calloutPlugin(md: MarkdownIt) {
    md.block.ruler.before('fence', 'callout', (
        state: StateBlock,
        startLine: number,
        endLine: number,
        silent: boolean
    ): boolean => {
        let pos = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];
        
        // 检查是否以 > 开头
        if (state.src[pos] !== '>') {
            return false;
        }
        pos++;

        // 跳过空格
        while (pos < max && state.src[pos] === ' ') {
            pos++;
        }

        // 获取第一行内容
        const firstLine = state.src.slice(pos, max);
        const match = firstLine.match(CALLOUT_MARKER_REGEX);
        
        if (!match || !CALLOUT_TYPES.includes(match[1].toLowerCase() as CalloutType)) {
            return false;
        }

        // 解析属性
        const attrs: CalloutAttributes = {
            type: match[1].toLowerCase() as CalloutType,
        };

        // 解析 collapse 属性
        if (match[2]) {
            attrs.collapse = match[2] === '-';
        }

        // 解析 title
        if (match[3]) {
            attrs.title = match[3].trim();
        }
        
        if (silent) {
            return true;
        }

        let nextLine = startLine + 1;
        const lines: string[] = [];

        // 收集所有以 > 开头的后续行作为 callout 内容
        while (nextLine < endLine) {
            pos = state.bMarks[nextLine] + state.tShift[nextLine];
            max = state.eMarks[nextLine];

            if (state.src[pos] !== '>') {
                break;
            }

            pos++; // 跳过 >
            // 跳过一个空格（如果有的话）
            if (state.src[pos] === ' ') {
                pos++;
            }

            // 保存每一行，包括空行
            lines.push(state.src.slice(pos, max));
            nextLine++;
        }

        // 创建 token
        const token = state.push('callout_open', 'div', 1);
        token.markup = '>';
        token.block = true;
        token.meta = attrs;  // 存储解析的属性
        token.map = [startLine, nextLine];

        // 处理内容
        if (lines.length > 0) {
            // 使用 state.md.block.parse 来处理内容，这样可以支持所有块级格式
            const content = lines.join('\n');
            state.md.block.parse(
                content,
                state.md,
                state.env,
                state.tokens
            );
        }

        state.push('callout_close', 'div', -1);
        state.line = nextLine;
        
        return true;
    });
}

// // 测试代码
// if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
//     const text = `
// > [!info]+ 这是一个带标题的可折叠信息块
// >
// > 
// > 这是一个信息块
// >
// > 第二行内容
// > - 列表项1
// > - 列表项2
// >
// > ### 三级标题
// > 第三行*内容*

// > [!warning]- 这是一个带标题的不可折叠警告块
// > 警告内容

// > [!tip] 这是一个只有标题的提示块
// > 提示内容

// 普通文本

// > 普通quote
// > 1
// > 2
// `;

//     const converter = new BaseConverter('quarto');
//     console.log(converter.convert(text));
//     // console.log(converter.md.parse(text, {}));
// }
