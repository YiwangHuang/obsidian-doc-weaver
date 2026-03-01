import MarkdownIt from 'markdown-it';

/**
 * 创建一个无规则的 MarkdownIt 实例
 * 只保留最基本的 paragraph 规则，并将其配置为输出纯文本
 * @returns {MarkdownIt} 配置好的 MarkdownIt 实例
 */
function PlainMarkdownIt(): MarkdownIt {
    // 创建一个 zero preset 实例
    const md = new MarkdownIt('zero');

    // 禁用所有内置规则，除了 paragraph（因为 paragraph 是基础规则，不能完全禁用）
    md.disable([
        // block
        'code',
        'fence',
        'heading',
        'hr',
        'html_block',
        'lheading',
        'list',
        'reference',
        'table',
        
        // inline
        'autolink',
        'backticks',
        'emphasis',
        'entity',
        'escape',
        'html_inline',
        'image',
        'link',
        'newline',
        'text'
    ]);

    // 自定义 paragraph 的渲染规则，使其输出纯文本
    md.renderer.rules.paragraph_open = () => '';  // 段落开始不输出任何内容
    md.renderer.rules.paragraph_close = () => '\n\n';  // 段落结束输出两个换行
    md.renderer.rules.text = (tokens, idx) => tokens[idx].content;  // 文本内容原样输出

    return md;
}


// 处理文件名,在扩展名前插入随机数
function addHexId(filename: string): string {
    // 生成6位随机十六进制数
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    
    // 基本扩展名，匹配: .txt, .png, .jpg, .mp3, .mp4
    const basicExt = /\.([a-zA-Z0-9]+)$/;
    //多重扩展名，匹配: .tar.gz, .min.js, .d.ts
    const multiExt = /\.([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*)$/;
    
    if(filename.match(multiExt)){
        // 在扩展名前插入随机数
        return filename.replace(multiExt, `_${randomHex}.$1`);
    }
    // 在基本扩展名前插入随机数
    return filename.replace(basicExt, `_${randomHex}.$1`);
}

// 测试代码
if (require.main === module) {
    const md = PlainMarkdownIt();
    const text = `
### 测试标题
## 测试文本

1. 123
2. 456

\`\`\`python
print("Hello, World!")
\`\`\`

> 测试引用<br>

`;
    console.debug(md.render(text));  // 应该输出原始文本，只保留基本的段落分隔

    const originText = `example.tar.gz`;
    const newText = addHexId(originText);
    console.debug(newText);
}