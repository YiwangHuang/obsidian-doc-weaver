// tab_like 插件调试脚本 (TypeScript版本)
// 用于开发过程中快速测试和预览功能效果

import MarkdownIt from 'markdown-it';
import * as fs from 'fs';
import * as path from 'path';
import { tab } from './src/index';
import type { MarkdownItTabOptions } from './src/options';

/**
 * 调试配置选项
 */
interface DebugOptions {
  // 是否保存HTML输出到文件
  saveToFile?: boolean;
  // 输出文件名
  outputFilename?: string;
  // 自定义标签配置
  tabOptions?: MarkdownItTabOptions;
  // 自定义测试内容
  customContent?: string;
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: DebugOptions = {
  saveToFile: false,
  outputFilename: 'tab_like_debug.html',
  tabOptions: undefined, // 使用默认选项
};

/**
 * 测试示例Markdown内容
 */
const DEFAULT_TEST_CONTENT = `
# Tab插件调试示例

## 基础标签页

::: tabs
@tab 标签1
这是标签1的内容，支持 **粗体** 和 *斜体*。

@tab 标签2
这是标签2的内容。
- 列表项1
- 列表项2
- 列表项3

@tab:active 标签3
这是默认激活的标签页。
\`\`\`js
console.log("可以包含代码块");
\`\`\`
:::

## 带ID的标签页

::: tabs#unique-id
@tab 标签A#tab-a
带有ID的标签A

@tab 标签B#tab-b
带有ID的标签B
:::

## 嵌套标签页

::: tabs
@tab 外层标签
外层内容开始

::: tabs
@tab 内层标签1
内层内容1
@tab 内层标签2
内层内容2
:::

外层内容结束
:::

## 自定义选项测试

使用自定义名称的标签也可以渲染：

\`\`\`
const customMd = new MarkdownIt().use(tab, {
  name: "custom-tabs",
});
\`\`\`

::: custom-tabs
@tab 自定义标签
这里在默认配置下不会被渲染为标签，需要自定义name选项
:::
`;

/**
 * 基础CSS样式
 */
const CSS_STYLES = `
/* 基础样式 */
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

/* 标签容器样式 */
.tabs-tabs-wrapper {
    margin: 1rem 0;
    border: 1px solid #ddd;
    border-radius: 5px;
    overflow: hidden;
}

/* 标签头部样式 */
.tabs-tabs-header {
    display: flex;
    border-bottom: 1px solid #ddd;
    background: #f5f5f5;
}

/* 标签按钮样式 */
.tabs-tab-button {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: 500;
}

.tabs-tab-button:hover {
    background: #e9e9e9;
}

.tabs-tab-button.active {
    background: #fff;
    border-bottom: 2px solid #4263eb;
}

/* 标签内容容器 */
.tabs-tabs-container {
    padding: 1rem;
}

/* 标签内容 */
.tabs-tab-content {
    display: none;
}

.tabs-tab-content.active {
    display: block;
}

/* 代码块样式 */
pre {
    background: #f6f8fa;
    padding: 1rem;
    border-radius: 5px;
    overflow-x: auto;
}

code {
    font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
}
`;

/**
 * 标签页交互脚本
 */
const TABS_SCRIPT = `
// 简单的标签切换功能
document.addEventListener('DOMContentLoaded', function() {
    // 为所有标签按钮添加点击事件
    const tabButtons = document.querySelectorAll('.tabs-tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 获取当前标签组
            const tabsWrapper = this.closest('.tabs-tabs-wrapper');
            
            // 获取标签索引
            const tabIndex = this.getAttribute('data-tab');
            
            // 取消当前组内所有标签的激活状态
            tabsWrapper.querySelectorAll('.tabs-tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // 隐藏当前组内所有内容
            tabsWrapper.querySelectorAll('.tabs-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // 激活当前标签按钮
            this.classList.add('active');
            
            // 显示对应内容
            tabsWrapper.querySelector(\`.tabs-tab-content[data-index="\${tabIndex}"]\`).classList.add('active');
        });
    });
});
`;

/**
 * 调试器类，用于测试tab_like插件功能
 */
class TabLikeDebugger {
  private md: MarkdownIt;
  private options: DebugOptions;
  
  /**
   * 构造函数
   * @param options 调试选项
   */
  constructor(options: DebugOptions = DEFAULT_OPTIONS) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // 创建markdown-it实例并加载插件
    this.md = new MarkdownIt({ linkify: true });
    this.md.use(tab, this.options.tabOptions);
  }
  
  /**
   * 渲染Markdown内容
   * @param content Markdown内容
   * @returns 渲染后的HTML
   */
  render(content: string): string {
    return this.md.render(content);
  }
  
  /**
   * 生成完整的HTML文档
   * @param renderedContent 已渲染的HTML内容
   * @returns 完整的HTML文档
   */
  generateHtml(renderedContent: string): string {
    // 自定义名称标识
    const namePrefix = this.options.tabOptions?.name || 'tabs';
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tab_like 插件调试</title>
    <style>
        ${CSS_STYLES.replace(/tabs/g, namePrefix)}
    </style>
</head>
<body>
    <h1>Tab_like 插件调试页面</h1>
    <div id="content">
        ${renderedContent}
    </div>

    <script>
        ${TABS_SCRIPT.replace(/tabs/g, namePrefix)}
    </script>
</body>
</html>
`;
  }
  
  /**
   * 保存HTML到文件
   * @param html HTML内容
   * @param filename 文件名
   */
  saveToFile(html: string, filename: string = this.options.outputFilename || 'tab_like_debug.html'): void {
    const outputPath = path.resolve(process.cwd(), filename);
    fs.writeFileSync(outputPath, html);
    console.log(`已保存到 ${outputPath}`);
  }
  
  /**
   * 运行调试器
   * @param content 自定义Markdown内容，不提供则使用默认内容
   */
  run(content?: string): void {
    // 使用提供的内容或默认内容
    const markdownContent = content || this.options.customContent || DEFAULT_TEST_CONTENT;
    
    // 渲染内容
    const renderedHtml = this.render(markdownContent);
    
    // 生成完整HTML
    const fullHtml = this.generateHtml(renderedHtml);
    
    // 输出结果
    console.log('渲染完成');
    console.log('--------------------------------------');
    
    // 根据选项决定是否保存到文件
    if (this.options.saveToFile) {
      this.saveToFile(fullHtml);
    } else {
      console.log('HTML输出预览 (复制以下内容到HTML文件中查看效果):');
      console.log('--------------------------------------');
      console.log(fullHtml);
      console.log('--------------------------------------');
      console.log('要保存结果，可设置选项 saveToFile: true');
    }
  }
}

// 检查命令行参数
const shouldSaveToFile = process.argv.includes('--save');

// 实例化调试器
const tabDebugger = new TabLikeDebugger({
  saveToFile: shouldSaveToFile
});

// 运行调试
tabDebugger.run();

// 导出调试器类，方便通过导入使用
export { TabLikeDebugger, DEFAULT_TEST_CONTENT }; 