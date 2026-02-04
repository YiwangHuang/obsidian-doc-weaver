import { BaseConverter, AdvancedConverter } from '../textConverter';
import { VAR_ATTACHMENT_FILE_NAME } from '../../../lib/constant';
// import { getHeadingText } from '../../../lib/noteResloveUtils';
// import { ensureRelativePath } from '../../../lib/pathUtils';
// import * as path from 'path';
import url from 'url';
import StateBlock from 'markdown-it/lib/rules_block/state_block.mjs';

const OBSIDIAN_LINK = 'obsidian_link';

// TODO: 考虑基于markdown-it-wiki-links插件重写渲染规则
// TODO: 考虑兼容![[image.png|77%]]这样的格式，用于控制图片宽度

BaseConverter.registerProcessor({
    name: 'obsidianLinkParserRule',
    formats: ['quarto', 'HMD', 'typst', 'plain'],
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
    name: 'obsidianLinkRendererRule',
    formats: ['typst','HMD','quarto','plain'],
    description: '自定义双链接渲染规则,支持所有格式。直接在预设模板中替换{{attachmentFileName}}占位符为附件文件名',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules[OBSIDIAN_LINK] = (tokens, idx) => {
            const linkToken = tokens[idx];
            if(linkToken.hidden){
                return '';
            }
            const attachment_file_name = linkToken.content;
            return '\n'+converter.attachment_ref_template.replace(VAR_ATTACHMENT_FILE_NAME, attachment_file_name)+'\n\n';
        };
    }
});

// BaseConverter.registerProcessor({
//     name: 'obsidianLinkRendererRule_plain',
//     formats: ['plain'],
//     description: '自定义双链接渲染规则',
//     mditRuleSetup: (converter: BaseConverter) => {
//         // 在plain类型中不进行hidden属性判断，全部渲染
//         converter.md.renderer.rules[OBSIDIAN_LINK] = (tokens, idx) => {
//             return `![[${tokens[idx].content}]]`;
//         };
//     }
// });


// 识别引用类型，对.md进行特殊处理；对于其他文件类型，查找路径并推入数组
// 根据文件名在从当前目录开始逐级查找文件，返回文件路径
function obsidianLinkPlugin(converter: BaseConverter){
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

        if(converter instanceof AdvancedConverter ){

            const linkToken = state.push(OBSIDIAN_LINK, 'a', 0);
            linkToken.hidden = true;
            converter.linkParser.parseLink(linkMatch[1], state, linkToken);
            linkToken.map = [startLine, startLine + 1];
        } else {
            const token = state.push('paragraph_open', 'p', 1);
            token.map = [startLine, startLine + 1];
            // 创建链接token
            const linkToken = state.push(OBSIDIAN_LINK, 'a', 0);
            linkToken.content = linkMatch[1].split('|')[0]; // 链接的文件名(不包含装饰器)
            state.push('paragraph_close', 'p', -1);
        }

        state.line = startLine + 1;
        return true;
    });
}

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
    // console.log(path.posix.join(__filename))
}