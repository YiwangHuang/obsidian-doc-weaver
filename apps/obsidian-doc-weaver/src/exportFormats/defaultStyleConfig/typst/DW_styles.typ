#import "@preview/octique:0.1.0": * // Octicons icons support (https://primer.style/octicons/) / 支持 Octicons 图标（https://primer.style/octicons/）

// Define callout style (collapse reserved) / 定义 callout 格式（collapse 属性备用）
#let callout(type: "note", title: none, collapse: none, hidden_types: (), body) = {
  // Hide types listed in hidden_types / 如果 type 在 hidden_types 中则隐藏
  if type in hidden_types { return [] }

  // ── Color palette grouped by semantics / 颜色定义：按语义分组，相近类型共享颜色 ──
  let color = if type in ("note", "seealso") { rgb("#448aff") }                   // Blue — note/seealso / 蓝色—笔记/另见
    else if type in ("abstract", "summary", "tldr") { rgb("#00bcd4") }            // Cyan — abstract/summary / 青色—摘要/总结
    else if type in ("info", "todo") { rgb("#448aff") }                           // Blue — info/todo / 蓝色—信息/待办
    else if type in ("tip", "hint", "important") { rgb("#00bcd4") }               // Cyan — tips/important / 青色—提示/重要
    else if type in ("success", "check", "done") { rgb("#4caf50") }               // Green — success/done / 绿色—成功/完成
    else if type in ("question", "help", "faq") { rgb("#e6a700") }                // Amber — question/help / 黄色—疑问/帮助
    else if type in ("warning", "caution", "attention") { rgb("#ff9800") }        // Orange — warning/attention / 橙色—警告/注意
    else if type in ("failure", "missing") { rgb("#f44336") }                     // Red — failure/missing / 红色—失败/缺失
    else if type in ("danger", "error") { rgb("#e53935") }                        // Dark red — danger/error / 深红色—危险/错误
    else if type == "bug" { rgb("#f44336") }                                      // Red — bug / 红色—缺陷
    else if type == "example" { rgb("#7c4dff") }                                  // Purple — example / 紫色—示例
    else if type in ("quote", "cite") { rgb("#9e9e9e") }                          // Gray — quote/cite / 灰色—引用
    else { gray }

  // ── Octicons icons; similar types share the same icon / 图标定义：使用 Octicons 图标，相近类型共享图标 ──
  let icon = if type in ("note", "seealso") { octique("pencil", width: 1em, color: color) }                  // Pencil / 铅笔
    else if type in ("abstract", "summary", "tldr") { octique("list-unordered", width: 1em, color: color) }  // List / 列表
    else if type == "info" { octique("info", width: 1em, color: color) }                                     // Info / 信息
    else if type == "todo" { octique("checklist", width: 1em, color: color) }                                // Checklist / 清单
    else if type in ("tip", "hint", "important") { octique("light-bulb", width: 1em, color: color) }         // Light bulb / 灯泡
    else if type in ("success", "check", "done") { octique("check-circle", width: 1em, color: color) }       // Check circle / 勾选圆圈
    else if type in ("question", "help", "faq") { octique("question", width: 1em, color: color) }            // Question / 问号
    else if type in ("warning", "caution", "attention") { octique("alert", width: 1em, color: color) }       // Alert / 警告
    else if type in ("failure", "missing") { octique("x-circle", width: 1em, color: color) }                 // X circle / X 圆圈
    else if type in ("danger", "error") { octique("zap", width: 1em, color: color) }                         // Zap / 闪电
    else if type == "bug" { octique("bug", width: 1em, color: color) }                                       // Bug / 虫子
    else if type == "example" { octique("list-ordered", width: 1em, color: color) }                          // Ordered list / 有序列表
    else if type in ("quote", "cite") { octique("quote", width: 1em, color: color) }                         // Quote / 引号
    else { ">" }
  
  block(
    width: 100%,    // Full width / 块宽度占满容器
    fill: color.lighten(90%),    // Background (lightened) / 背景色（对应颜色的浅色版本）
    stroke: (left: 2pt + color), // Left border / 左边框（2pt，对应类型颜色）
    inset: (
      left: 0.5em,    // Left padding / 左内边距
      right: 0.5em,   // Right padding / 右内边距
      top: 0.5em,     // Top padding / 上内边距
      bottom: 0.5em   // Bottom padding / 下内边距
    ),
    radius: 5pt,    // Corner radius / 圆角半径
    spacing: 0.1em, // Inner spacing / 块内元素（标题与正文）间距
    above: 0.5em,   // Space above / 与上方内容间距
    below: 0.5em,   // Space below / 与下方内容间距
    [
      // Vertically align icon and title via baseline / 使用 baseline 实现图标与标题垂直居中对齐
      #box(icon, baseline: 15%) 
      #if title != none {
        [#text(title, fill: color, weight: "extrabold") #linebreak()] //[#title #linebreak()]
      }
      #body
    ]
  )
}

// (Optional) keep builtin underline reference / （可选）保存内置 underline 引用，便于包装且不丢失自动换行能力
// #let underline__builtin = underline

// Redefine underline to support blanks while preserving layout / 重定义下划线以支持“填空”效果，并保持原生换行与布局
// - show_content: show/hide the text (hidden text becomes transparent) / show_content：是否显示正文（隐藏时文字透明，但仍按长度绘制下划线）
// - line_break: multi-line blanks (auto line count in some modes) / line_break：多行填空（部分模式下会自动计算行数）
#let DW_underline(
  body,
  stroke: 0.6pt+black,
  offset: 2pt,
  evade: false, // Evade text / 是否避开文字
  show_content: true,    // Show content / 是否显示正文内容
  line_break: false,      // Multi-line blanks / 多行填空（为 true 时创建多行效果）
) = {
  let content_to_show = if show_content { body } else { text(fill: rgb(0, 0, 0, 0))[#body] }
  
  // Preserve auto line wrapping / 保留自动换行能力
  // When line_break=true and show_content=false, estimate line count and draw multiple blank lines / 当 line_break=true 且 show_content=false 时，估算行数并绘制多行填空
  if line_break and not show_content {
    context {
      // Prepare content to measure / 准备要测量的内容
      let content_to_show = if show_content { body } else { text(fill: rgb(0, 0, 0, 0))[#body] }
      
      // Measure within the current layout width / 使用 layout 获取容器宽度并测量
      layout(size => {
        let container_width = size.width
        
        // Rough estimate: ceil(text_width / container_width) / 粗略估算：向上取整（文本宽度 / 容器宽度）得到行数
        let measured = measure(content_to_show)
        let calculated_lines = calc.max(1, calc.ceil(measured.width / container_width))
        let line_height = 1em  // 固定行高
        
        // Debug info (optional) / 调试信息（可选）
        // [Text width: #measured.width, container width: #container_width, lines: #calculated_lines] / [文本宽度: #measured.width，容器宽度: #container_width，行数: #calculated_lines] 
        // linebreak()
        
        // Build multi-line blanks / 创建多行填空布局
        stack(
          dir: ttb,
          spacing: line_height,
          ..range(calculated_lines).map(i => {
            stack(
              dir: ttb,
              spacing: offset,
              // Only render content on the first line / 只在第一行显示内容
              v(line_height),
              line(length: 100%, stroke: stroke)
            )
          })
        )
      })
    }
  } else if line_break {
    // set par(justify: true) // (Optional) justify paragraph / （可选）两端对齐
    linebreak()
    underline(stroke: stroke, offset: offset, evade: evade)[#content_to_show]
  } else {
    // underline__builtin(stroke: stroke, offset: offset, evade: evade)[#content_to_show]
      context {
        let thickness = 0.6pt
        let stroke = black
    let size = measure(content_to_show)
    box(
      baseline: offset, // Align baseline with text / 设置 box 基线位置与文字对齐
      stack(
        dir: ttb,
        spacing: offset,
        content_to_show,
        line(
          length: size.width,
          stroke: (thickness + stroke)
        )
      )
    )
  }
  }
}

