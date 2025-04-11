import MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';
import { BaseConverter } from '../textConverter';

/**
 * 使用 markdown-it-container 注册一个名为 'col' 的自定义容器插件
 * 支持自定义容器内 Markdown 内容的解析规则，以及使用 @col 标记分割多列内容
 */
BaseConverter.registerProcessor({
    name: 'colContainerProcessor',
    formats: ['quarto', 'vuepress', 'typst', 'plain'],
    description: '自定义col容器解析规则',
    mditRuleSetup: (converter: BaseConverter) => {
        // 注册自定义容器插件
        converter.md.use(container, 'col', {
            // 验证函数：确定容器是否应该被处理
            validate: function(params: string) {
                // 检查容器标记是否为 'col'，并可以包含其他参数
                // 返回 true 表示这是一个有效的 'col' 容器
                return params.trim().split(' ', 2)[0] === 'col';
            },
            
            // 自定义渲染函数，处理容器的开始和结束标记
            render: function(tokens: any[], idx: number, _options: any, env: any, self: any) {
                // 获取当前 token
                const token = tokens[idx];
                
                // 对于开始标记
                if (tokens[idx].nesting === 1) {
                    // 提取容器参数 (例如: col width(25%,50%,25%))
                    const params = token.info.trim().substring(3).trim();
                    
                    // 从参数中提取宽度信息
                    const widthMatch = params.match(/width\((.*?)\)/);
                    const widths = widthMatch ? widthMatch[1].split(',').map((w: string) => w.trim()) : [];
                    
                    // 使用自定义属性存储宽度信息，供后续处理使用
                    token.meta = { widths };
                    
                    // 查找容器内容并解析@col标记，分割成多列
                    // 首先，定位容器结束的位置
                    let contentEndIdx = idx;
                    for (let i = idx + 1; i < tokens.length; i++) {
                        if (tokens[i].type === 'container_col_close') {
                            contentEndIdx = i;
                            break;
                        }
                    }
                    
                    // 获取容器内容（注意：这里我们不再直接提取内容，而是在结束标记时处理）
                    token.meta.contentStartIdx = idx + 1;
                    token.meta.contentEndIdx = contentEndIdx;
                    
                    // 预处理：提取@col标记的位置
                    const columnMarkers: number[] = [];
                    for (let i = idx + 1; i < contentEndIdx; i++) {
                        const t = tokens[i];
                        if (t.type === 'paragraph_open' && 
                            tokens[i+1] && tokens[i+1].type === 'inline' && 
                            tokens[i+1].content.trim() === '@col') {
                            columnMarkers.push(i);
                            // 标记这些@col标记为需要删除的内容
                            t.meta = { ...(t.meta || {}), isColMarker: true };
                            tokens[i+1].meta = { ...(tokens[i+1].meta || {}), isColMarker: true };
                            if (tokens[i+2]) {
                                tokens[i+2].meta = { ...(tokens[i+2].meta || {}), isColMarker: true };
                            }
                        }
                    }
                    
                    // 保存列标记位置到开始标记的元数据中
                    token.meta.columnMarkers = columnMarkers;
                    
                    // 根据输出格式生成适当的开始标记
                    if (converter.format === 'typst') {
                        // Typst格式的开始标记
                        return `#grid(\n${widths.length ? `columns: (${widths.map((w: string) => w.replace('%', 'fr')).join(', ')}),\n` : ''}`;
                    } else if (converter.format === 'quarto') {
                        // Quarto格式的开始标记
                        return `:::: columns\n`;
                    } else {
                        // 其他格式的开始标记
                        return `<div class="col-container">\n`;
                    }
                } else {
                    // 对于结束标记
                    
                    // 查找对应的开始标记和其元数据
                    const openToken = findOpenToken(tokens, idx);
                    if (!openToken || !openToken.meta) {
                        // 如果找不到开始标记，只返回普通的结束标记
                        return self.renderToken(tokens, idx, _options);
                    }
                    
                    // 获取内容范围
                    const contentStartIdx = openToken.meta.contentStartIdx || (idx + 1);
                    const contentEndIdx = openToken.meta.contentEndIdx || (idx - 1);
                    const columnMarkers = openToken.meta.columnMarkers || [];
                    const widths = openToken.meta.widths || [];
                    
                    // 处理多列内容
                    const columns: string[] = [];
                    
                    // 如果有列标记，则按列标记分割内容
                    if (columnMarkers.length > 0) {
                        // 处理第一列（从内容开始到第一个标记之前）
                        if (contentStartIdx < columnMarkers[0]) {
                            columns.push(renderTokens(tokens.slice(contentStartIdx, columnMarkers[0]), 
                                _options, env, converter.md));
                        }
                        
                        // 处理中间的列
                        for (let i = 0; i < columnMarkers.length; i++) {
                            const startIdx = columnMarkers[i] + 3; // 跳过@col段落标记
                            const endIdx = i < columnMarkers.length - 1 ? columnMarkers[i + 1] : contentEndIdx;
                            
                            if (startIdx < endIdx) {
                                columns.push(renderTokens(tokens.slice(startIdx, endIdx), 
                                    _options, env, converter.md));
                            } else {
                                // 空列
                                columns.push('');
                            }
                        }
                    } else {
                        // 如果没有列标记，则整个内容作为一列
                        columns.push(renderTokens(tokens.slice(contentStartIdx, contentEndIdx), 
                            _options, env, converter.md));
                    }
                    
                    // 根据输出格式生成列内容和结束标记
                    let result = '';
                    
                    if (converter.format === 'typst') {
                        // 渲染Typst格式的列内容
                        columns.forEach((colContent: string, i: number) => {
                            result += `[\n${colContent}\n],\n`;
                        });
                        result += ')\n'; // 结束Grid
                    } else if (converter.format === 'quarto') {
                        // 渲染Quarto格式的列内容
                        columns.forEach((colContent: string, i: number) => {
                            const width = widths[i] || '1fr';
                            result += `::: {.column width="${width}"}\n${colContent}\n:::\n`;
                        });
                        result += '::::\n'; // 结束列容器
                    } else {
                        // 渲染普通HTML格式的列内容
                        columns.forEach((colContent: string) => {
                            result += `<div class="col-content">\n${colContent}\n</div>\n`;
                        });
                        result += '</div>\n'; // 结束列容器
                    }
                    
                    return result;
                }
            }
        });

        // 可以在这里添加任何其他与col容器相关的规则设置
    }
});

/**
 * 查找与关闭标记对应的开始标记
 * @param tokens 所有标记数组
 * @param closeIdx 关闭标记的索引
 * @returns 对应的开始标记或null
 */
function findOpenToken(tokens: any[], closeIdx: number) {
    // 找到与关闭标记对应的开始标记
    for (let i = closeIdx - 1; i >= 0; i--) {
        if (tokens[i].type === 'container_col_open') {
            return tokens[i];
        }
    }
    return null;
}

/**
 * 使用markdown-it渲染一组token为HTML
 * @param tokens 要渲染的token数组
 * @param options markdown-it选项
 * @param env markdown-it环境
 * @param md markdown-it实例
 * @returns 渲染后的HTML字符串
 */
function renderTokens(tokens: any[], options: any, env: any, md: MarkdownIt): string {
    // 过滤掉已标记为列标记的token
    tokens = tokens.filter(t => !(t.meta && t.meta.isColMarker));
    if (tokens.length === 0) return '';
    
    // 创建一个新的token数组，复制原始token
    const newTokens = tokens.map(t => ({ ...t }));
    
    // 创建临时的State对象
    const tempState = {
        tokens: newTokens,
        env: env
    };
    
    // 使用markdown-it的renderer渲染tokens
    return md.renderer.render(newTokens, options, tempState);
}

// 提供一个测试函数
if (import.meta.url === 'file://' + process.argv[1]) {
    const converter = new BaseConverter();
    
    // 测试markdown - 带有@col分隔符的多列内容
    const testMarkdown = `
::: col width(25%,50%,25%)
@col
这是第一列的内容。

- 项目1
- 项目2
  - 子项目
  
@col
这是第二列的内容。

**粗体文本** 和 *斜体文本*

@col
这是第三列的内容。

> 引用内容
:::
    `;
    
    // 测试各种格式的输出
    console.log('=== Typst 格式 ===');
    console.log(converter.convert(testMarkdown, 'typst'));
    
    console.log('\n=== Quarto 格式 ===');
    console.log(converter.convert(testMarkdown, 'quarto'));
    
    console.log('\n=== 普通格式 ===');
    console.log(converter.convert(testMarkdown, 'plain'));
}


