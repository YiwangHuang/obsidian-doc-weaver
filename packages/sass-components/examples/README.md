# Callout 样式示例

这个目录包含了用于测试 SASS Components Library 中 callout 样式的 HTML 文件。

## 文件说明

- `index.html` - 主要的样式展示页面，包含所有 callout 类型的示例

## 如何查看

1. 首先构建 CSS 文件：
   ```bash
   cd packages/sass-components
   pnpm run build
   ```

2. 启动本地服务器：
   ```bash
   pnpm run serve
   ```

3. 在浏览器中访问 `http://localhost:8080` 查看样式效果

## 支持的 Callout 类型

根据 `CalloutProcessor.ts` 中定义的类型，支持以下 callout：

### 信息类型 (蓝色系)
- `info` - 信息提示
- `note` - 笔记

### 摘要类型 (青蓝色系)
- `abstract` - 摘要
- `tldr` - 太长不看
- `summary` - 总结

### 成功类型 (绿色系)
- `success` - 成功
- `check` - 检查
- `done` - 完成

### 警告类型 (黄色系)
- `warning` - 警告
- `caution` - 注意
- `attention` - 留意

### 错误/危险类型 (红色系)
- `danger` - 危险
- `error` - 错误
- `bug` - 程序错误
- `failure` - 失败
- `missing` - 缺失

### 提示类型 (紫色系)
- `tip` - 提示
- `hint` - 暗示
- `important` - 重要

### 问题类型 (橙色系)
- `question` - 问题
- `help` - 帮助

### 其他类型
- `quote` - 引用 (灰色系)
- `example` - 示例 (青绿色系)
- `todo` - 待办 (品红色系)

## HTML 结构

每个 callout 使用以下 HTML 结构：

```html
<blockquote class="callout" data-callout="类型名" data-callout-title="标题文本">
    <div class="callout-title">标题</div>
    <div class="callout-content">
        <p>内容</p>
    </div>
</blockquote>
```

其中：
- `data-callout` 属性指定 callout 类型
- `data-callout-title` 属性可选，用于指定标题
- `data-callout-fold` 属性可选，用于指定折叠状态（`+` 或 `-`）
