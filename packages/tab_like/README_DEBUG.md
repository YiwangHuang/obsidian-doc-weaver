# Tab_like 插件调试指南

本文档提供了如何使用调试工具来测试和开发 Tab_like 插件的说明。

## 准备工作

首先确保已安装项目依赖：

```bash
pnpm install
```

## 调试方法

### 方法一：使用调试脚本

我们提供了两个简便的脚本来运行调试工具：

1. 只预览HTML输出（显示在控制台）：

```bash
pnpm run debug
```

2. 预览并保存HTML到文件（默认为 `tab_like_debug.html`）：

```bash
pnpm run debug:save
```

### 方法二：直接运行TypeScript文件

如果需要自定义调试参数，可以直接运行TypeScript文件：

```bash
# 只预览
ts-node debug.ts

# 保存到文件
ts-node debug.ts --save
```

### 方法三：使用JavaScript版本

如果不想使用TypeScript，也可以使用JavaScript版本：

```bash
# 安装Node.js依赖
npm install markdown-it

# 运行JavaScript调试脚本
node debug.js

# 保存到文件
node debug.js --save
```

## 自定义调试

### 修改测试内容

要测试不同的Markdown内容，可以编辑 `debug.ts` 或 `debug.js` 文件中的 `DEFAULT_TEST_CONTENT` 变量。

### 使用不同的配置选项

要测试不同的配置选项，可以修改调试器实例化时的选项：

```javascript
// TypeScript版本
const tabDebugger = new TabLikeDebugger({
  saveToFile: shouldSaveToFile,
  tabOptions: {
    name: "custom-tabs",
    // 其他自定义选项...
  }
});

// JavaScript版本
const md = new MarkdownIt({ linkify: true }).use(tab, {
  name: "custom-tabs",
  // 其他自定义选项...
});
```

## 调试API参考

### TypeScript版本

`TabLikeDebugger` 类提供了以下方法：

- `render(content: string)`: 渲染Markdown内容为HTML
- `generateHtml(renderedContent: string)`: 生成完整的HTML文档
- `saveToFile(html: string, filename?: string)`: 保存HTML到文件
- `run(content?: string)`: 运行完整的调试过程

### JavaScript版本

JavaScript版本导出了以下功能：

- `md`: 预配置的MarkdownIt实例
- `render(content)`: 渲染Markdown内容为HTML的函数
- `saveToFile(filename?)`: 保存HTML到文件的函数

## 调试界面使用

生成的HTML文件可以直接在浏览器中打开查看效果。标签切换功能已经通过JavaScript实现，点击标签可以切换内容。 