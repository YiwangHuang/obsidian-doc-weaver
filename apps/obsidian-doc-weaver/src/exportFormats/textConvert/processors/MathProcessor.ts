import { BaseConverter } from '../textConverter';
import tm from 'markdown-it-texmath';

// 不渲染，直接返回tex公式原文
const passthrough = {
    renderToString: (tex: string) => tex
};

/** 若整个内容被 \ce{...} 包裹，则提取内部内容；否则返回 null */
function extractCeContent(content: string): string | null {
    const match = content.trim().match(/^\\ce\{([\s\S]+)\}$/);
    return match ? match[1] : null;
}

/**
 * 将 mhchem (LaTeX \ce{}) 语法转换为 chemformula (Typst #ch()) 语法。
 * 主要处理：
 * 1. 删除上下标中的 {}：^{...} → ^...  /  _{...} → _...
 * 2. 核素/同位素前缀后添加空格：^227_90Th → ^227_90 Th
 * 3. 箭头运算符周围添加空格：U->_90 → U -> _90
 * 4. 反应式 + 号前添加空格：Th +_2 → Th + _2
 */
function convertCeToCh(ceContent: string): string {
    // 1. 删除上下标包裹的 {}
    let result = ceContent.replace(/\^\{([^}]*)\}/g, '^$1');
    result = result.replace(/_\{([^}]*)\}/g, '_$1');

    // 2. 同位素前缀后紧跟元素/粒子字母时插入空格
    //    匹配：^num / _num / ^num_num / _num^num 后紧跟字母（含粒子符号 n/p/e/d/t）
    result = result.replace(/([\^_][\d]+(?:[\^_][\d]+)?)([A-Za-z])/g, '$1 $2');

    // 3. 箭头运算符周围添加空格
    const arrows = /(->|<-|<->|<=>|<=>>|<<=>)/g;
    result = result.replace(arrows, ' $1 ');

    // 4. 反应式中的 + 号后添加空格（当后跟 _ ^ 或字母时，即公式/粒子片段开头）
    result = result.replace(/\+(?=[_\^A-Za-z])/g, ' + ');

    // 5. 箭头后面的 [text] 括号标注属于箭头本身，移除中间的多余空格
    result = result.replace(/(->|<-|<->|<=>|<=>>|<<=>)\s+\[/g, '$1[');

    // 6. ] 后紧跟字母时插入空格（括号标注与后续公式之间）
    result = result.replace(/\]([A-Za-z])/g, '] $1');

    // 7. 清理可能产生的多余空格
    result = result.replace(/\s{2,}/g, ' ').trim();

    return result;
}

BaseConverter.registerProcessor({
    name: 'mathParserRule',
    formats: ['quarto', 'typst', 'HMD','latex'],
    description: '自定义数学公式解析规则',
    preProcessor: (text: string) => {
        const lines = text.split('\n');
        let nesting = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(/^([\t >]*)\$\$[ \t]*$/);
            if (match) {
                // console.log(match);
                nesting *= -1;
                if (nesting == 1) {
                    lines[i] = match[1] +'\n'+ line;
                } else {
                    lines[i] = line + '\n'+ match[1];
                }
            }
        }
        // console.log(lines.join('\n'));
        return lines.join('\n');
    },
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.use(tm, {
            engine: passthrough, // 还可设置为katex
            delimiters: 'dollars'
        });
    }
});

BaseConverter.registerProcessor({
    name: 'mathRendererRule_typst',
    formats: ['typst'],
    description: '自定义数学公式渲染规则，对于化学方程式使用暂时解决方案（待优化）',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.math_block = (tokens, idx) => {
            const content = tokens[idx].content.trim();
            const ceContent = extractCeContent(content);
            if (ceContent !== null) {
                return `#ch("${convertCeToCh(ceContent)}")\n`;
            }
            return `\n#mitex[\`${content}\`]\n`;
        };
        converter.md.renderer.rules.math_inline = (tokens, idx) => {
            const content = tokens[idx].content.trim();
            const ceContent = extractCeContent(content);
            if (ceContent !== null) {
                return `#ch("${convertCeToCh(ceContent)}")`;
            }
            return `#mi[\`${content}\`]`;
        };
    }
});


BaseConverter.registerProcessor({
    name: 'mathRendererRule_quarto',
    formats: ['quarto'],
    description: '自定义数学公式渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.math_block = (tokens, idx) => {
            return `\n$$\n${tokens[idx].content.trim()}\n$$\n\n`;
        };
        converter.md.renderer.rules.math_inline = (tokens, idx) => {
            return `$${tokens[idx].content.trim()}$`;
        };
    }
});

BaseConverter.registerProcessor({
    name: 'mathRendererRule_HMD',
    formats: ['HMD','latex'],
    description: '自定义数学公式渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {// TODO: 增加设置项控制是否为标号公式
        converter.md.renderer.rules.math_block = (tokens, idx) => {
            return `\n\\[\n${tokens[idx].content.trim()}\n\\]\n\n`;
            // return `\n\\begin{equation}\n${tokens[idx].content.trim()}\n\\end{equation}\n\n`;
        };
        converter.md.renderer.rules.math_inline = (tokens, idx) => {
            return `$${tokens[idx].content.trim()}$`;
        };
    }
});
