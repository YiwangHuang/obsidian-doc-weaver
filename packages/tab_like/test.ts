/**
 * 简单的 tab_like 插件测试文件
 * 用于测试 Markdown-it 插件，显示tokens和渲染的HTML
 * 
 * 使用方法：
 * ts-node test.ts
 */

import MarkdownIt from 'markdown-it';
import { tab } from './src/index';

// 测试用的 Markdown 内容
const testMarkdown = `
# Tab 插件测试

## 基础标签页
::: tabs
@tab 第一个标签
这是第一个标签的内容。

包含一些 **粗体** 文字。

@tab:active 第二个标签
这是默认激活的第二个标签。

- 列表项1
- 列表项2

@tab 第三个标签#tab3
这是第三个标签，带有 ID。

\`\`\`javascript
console.log("代码块测试");
\`\`\`
:::

## 嵌套标签页测试
::: tabs
@tab 外层标签
外层内容开始

::: tabs
@tab 内层标签A
内层内容A
@tab 内层标签B
内层内容B
:::

外层内容结束
:::
`;

/**
 * 格式化并打印 tokens
 * @param tokens - markdown-it 生成的 tokens 数组
 */
function printTokens(tokens: any[]): void {
  console.log('\n=== TOKENS 解析结果 ===');
  console.log('--------------------------------------');
  
  tokens.forEach((token, index) => {
    console.log(`[${index.toString().padStart(2, '0')}] ${token.type}`);
    console.log(`     块级: ${token.block}`);
    console.log(`     标记: "${token.markup}"`);
    console.log(`     信息: "${token.info}"`);
    if (token.meta && Object.keys(token.meta).length > 0) {
      console.log(`     元数据: ${JSON.stringify(token.meta)}`);
    }
    if (token.content) {
      console.log(`     内容: "${token.content}"`);
    }
    if (token.map) {
      console.log(`     行映射: [${token.map[0]}, ${token.map[1]}]`);
    }
    console.log('');
  });
}

/**
 * 打印渲染的 HTML
 * @param html - 渲染后的 HTML 字符串
 */
function printHtml(html: string): void {
  console.log('\n=== HTML 渲染结果 ===');
  console.log('--------------------------------------');
  console.log(html);
  console.log('--------------------------------------');
}

/**
 * 运行测试
 */
function runTest(): void {
  console.log('🚀 开始测试 tab_like 插件...\n');
  
  // 创建 markdown-it 实例并加载插件
  const md = new MarkdownIt();
  md.use(tab);
  
  console.log('📝 测试 Markdown 内容:');
  console.log('--------------------------------------');
  console.log(testMarkdown);
  console.log('--------------------------------------');
  
  // 解析 tokens
  const tokens = md.parse(testMarkdown, {});
  
  // 打印 tokens
  printTokens(tokens);
  
  // 渲染 HTML
  const html = md.render(testMarkdown);
  
  // 打印 HTML
  printHtml(html);
  
  // 统计信息
  const tabsTokens = tokens.filter(token => token.type.includes('tabs'));
  const tabTokens = tokens.filter(token => token.type.includes('_tab_'));
  
  console.log('\n=== 统计信息 ===');
  console.log(`总 tokens 数量: ${tokens.length}`);
  console.log(`tabs 相关 tokens: ${tabsTokens.length}`);
  console.log(`tab 相关 tokens: ${tabTokens.length}`);
  
  // 验证基本功能
  console.log('\n=== 功能验证 ===');
  const hasTabsOpen = tokens.some(token => token.type === 'tabs_tabs_open');
  const hasTabsClose = tokens.some(token => token.type === 'tabs_tabs_close');
  const hasTabOpen = tokens.some(token => token.type === 'tabs_tab_open');
  const hasTabClose = tokens.some(token => token.type === 'tabs_tab_close');
  
  console.log(`✅ tabs容器开始标记: ${hasTabsOpen ? '存在' : '❌ 缺失'}`);
  console.log(`✅ tabs容器结束标记: ${hasTabsClose ? '存在' : '❌ 缺失'}`);
  console.log(`✅ tab开始标记: ${hasTabOpen ? '存在' : '❌ 缺失'}`);
  console.log(`✅ tab结束标记: ${hasTabClose ? '存在' : '❌ 缺失'}`);
  
  // 检查HTML中的关键元素
  const hasTabsWrapper = html.includes('tabs-tabs-wrapper');
  const hasTabsHeader = html.includes('tabs-tabs-header');
  const hasTabButton = html.includes('tabs-tab-button');
  const hasTabContent = html.includes('tabs-tab-content');
  const hasActiveTab = html.includes('active');
  
  console.log(`✅ HTML 包含 tabs-wrapper: ${hasTabsWrapper ? '是' : '❌ 否'}`);
  console.log(`✅ HTML 包含 tabs-header: ${hasTabsHeader ? '是' : '❌ 否'}`);
  console.log(`✅ HTML 包含 tab-button: ${hasTabButton ? '是' : '❌ 否'}`);
  console.log(`✅ HTML 包含 tab-content: ${hasTabContent ? '是' : '❌ 否'}`);
  console.log(`✅ HTML 包含 active 类: ${hasActiveTab ? '是' : '❌ 否'}`);
  
  console.log('\n✨ 测试完成！');
}

// 主程序入口
if (require.main === module) {
  try {
    runTest();
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    process.exit(1);
  }
}

// 导出测试函数，方便在其他文件中使用
export { runTest, testMarkdown };
