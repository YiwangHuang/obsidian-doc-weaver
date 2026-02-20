#import "slides_config.typ": *

// // ── Theme configuration / 主题配置 ──
// #show: metropolis-theme.with(
//   aspect-ratio: "16-9",
//   footer: self => self.info.institution,
//   config-info(
//     title: [Doc Weaver 幻灯片演示],
//     subtitle: [Typst × Touying],
//     author: [作者],
//     date: datetime.today(),
//     institution: [Doc Weaver],
//     logo: emoji.city,
//   ),
// )

// #set heading(numbering: numbly("{1}.", default: "1.1"))

// #title-slide()

#show: DW_slides.with(
  title: [Doc Weaver 幻灯片演示],
  subtitle: [Typst × Touying],
  author: [作者],
  date: datetime.today(),
  institution: [Doc Weaver],
)

= 目录 <touying:hidden>

#outline(title: none, indent: 1em, depth: 2)

= 简介

== 关于本模板

本文件是 Obsidian 插件 *Doc Weaver* 的预设 *Typst-幻灯片* 的演示。

插件将 Markdown 笔记导出为 Typst 源文件，借助 *Touying* 框架生成幻灯片 PDF。

如需调整主题与样式，请修改 `slides_config.typ`。

== 引入依赖

=== Touying

#link("https://touying-typ.github.io/")[Touying] 是 Typst 的幻灯片 package，提供分页、动画、主题等能力。

本模板套用其 #link("https://touying-typ.github.io/zh/docs/themes/metropolis/")[Metropolis 主题]，简洁美观，适合日常使用。

=== DW\_styles.typ

`DW_styles.typ` 是 Doc Weaver 的本地样式文件，用于集中定义样式与样式函数，例如 callout、DW_underline 等，并在幻灯片模板与文章模板之间共享。

=== 其他 packages

- `mitex`：支持 LaTeX 公式
- `tablem`：支持 Markdown 风格表格
- `numbly`：便捷编号

= 基本用法

== 分页

在 Touying 中，`=` 创建章节标题页，`==` 创建带标题的普通幻灯片。

#pagebreak()

使用 `#pagebreak()` 可手动插入分页。这是分页后的新一页内容。

== 动画

使用 `#pause` 控制内容分步显示：

第一步：这段文字立即可见。

#pause

第二步：点击后出现。

#pause

第三步：再次点击后出现。
