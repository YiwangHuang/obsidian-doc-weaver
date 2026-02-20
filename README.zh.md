# Doc Weaver

[中文](./README.zh.md) | [English](./README.md)

## 这是什么？

Doc Weaver 是一个 Obsidian 插件，用于将 **Markdown 笔记及其附件** 导出为 **结构化文档**，例如 Typst、HMD、Latex(开发中)。

## 功能亮点

- **多种导出格式**：Typst、HMD（面向二次处理的 Markdown）、Latex（开发中）……。
- **结构化输出**：自动收集嵌入附件并打包导出，并按目标格式重写引用与路径。
- **支持嵌入笔记**：可以处理 Obsidian 嵌入笔记。
- **可定制样式**：提供默认样式配置，并支持在此基础上进行覆写与扩展。
- **悬浮工具栏**：提供悬浮工具栏，增强编辑与导出体验（更顺手地进行选择、预览、导出等操作）。
- **插件协作**：支持与内容增强类插件协作，例如 AnyBlock、Excalidraw。
- **批量导出**：可以在文件列表中通过右键菜单实现批量导出

## 支持的导出格式

- **Typst**：适合排版与生成 PDF。
- **HMD（Hybrid Markdown）**：面向二次处理与发布的 Markdown 文档（通常包含大量 HTML），用于对接 VuePress / VitePress / Reveal.js 等下游流程。
- Latex（开发中）
- Pandoc（待开发）

## 适配的内容增强类插件

- **AnyBlock**：支持对 AnyBlock 插件生成的**部分内容块**（分栏和callout）进行导出。
- **Excalidraw**：支持对 Excalidraw 绘图的自动导出

## 反馈与贡献

- 如有问题或功能建议，欢迎在本仓库提交 Issue。
- 欢迎提交 PR。

## TODO

- [x] 为同一导出格式提供多个默认预设  
- [ ] 提供**通用设置选项卡**与**示例笔记**（包含 Typst 基础教程，并强调可在 VS Code 中进一步编辑 Typst 源文件）  
- [ ] 支持导出为 **LaTeX** 文档  
- [ ] 建立插件的 **GitHub Pages** 项目主页  
- [ ] 支持通过**图床引用的图片**  
- [ ] 支持导出为 **Pandoc** 文档  
- [ ] 支持导出为 **Quarto** 文档  

## License

本项目采用 **GPL-3.0** 协议发布，详见 `LICENSE`。

