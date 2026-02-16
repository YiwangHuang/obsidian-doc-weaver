#import "@preview/octique:0.1.0": * //支持Octicons图标,https://primer.style/octicons/

// 定义 callout 格式, collapse 属性备用
#let callout(type: "note", title: none, collapse: none, hidden_types: (), body) = {
  // 如果type在hidden_types中，返回空内容
  if type in hidden_types { return [] }

  // ── 颜色定义：按语义分组，相近类型共享颜色 ──
  let color = if type in ("note", "seealso") { rgb("#448aff") }                  // 蓝色 (Blue) — 笔记/另见
    else if type in ("abstract", "summary", "tldr") { rgb("#00bcd4") }            // 青色 (Cyan) — 摘要/总结
    else if type in ("info", "todo") { rgb("#448aff") }                           // 蓝色 (Blue) — 信息/待办
    else if type in ("tip", "hint", "important") { rgb("#00bcd4") }               // 青色 (Cyan) — 提示/重要
    else if type in ("success", "check", "done") { rgb("#4caf50") }               // 绿色 (Green) — 成功/完成
    else if type in ("question", "help", "faq") { rgb("#e6a700") }                // 黄色 (Amber) — 疑问/帮助
    else if type in ("warning", "caution", "attention") { rgb("#ff9800") }        // 橙色 (Orange) — 警告/注意
    else if type in ("failure", "missing") { rgb("#f44336") }                     // 红色 (Red) — 失败/缺失
    else if type in ("danger", "error") { rgb("#e53935") }                        // 深红色 (Dark Red) — 危险/错误
    else if type == "bug" { rgb("#f44336") }                                      // 红色 (Red) — 缺陷
    else if type == "example" { rgb("#7c4dff") }                                  // 紫色 (Purple) — 示例
    else if type in ("quote", "cite") { rgb("#9e9e9e") }                          // 灰色 (Gray) — 引用
    else { gray }

  // ── 图标定义：使用 Octicons 图标，相近类型共享图标 ──
  let icon = if type in ("note", "seealso") { octique("pencil", width: 1em, color: color) }                  // 铅笔图标
    else if type in ("abstract", "summary", "tldr") { octique("list-unordered", width: 1em, color: color) }  // 无序列表图标
    else if type == "info" { octique("info", width: 1em, color: color) }                                     // 信息图标
    else if type == "todo" { octique("checklist", width: 1em, color: color) }                                // 清单图标
    else if type in ("tip", "hint", "important") { octique("light-bulb", width: 1em, color: color) }         // 灯泡图标
    else if type in ("success", "check", "done") { octique("check-circle", width: 1em, color: color) }       // 勾选圆圈图标
    else if type in ("question", "help", "faq") { octique("question", width: 1em, color: color) }            // 问号图标
    else if type in ("warning", "caution", "attention") { octique("alert", width: 1em, color: color) }       // 警告三角图标
    else if type in ("failure", "missing") { octique("x-circle", width: 1em, color: color) }                 // X圆圈图标
    else if type in ("danger", "error") { octique("zap", width: 1em, color: color) }                         // 闪电图标
    else if type == "bug" { octique("bug", width: 1em, color: color) }                                       // 虫子图标
    else if type == "example" { octique("list-ordered", width: 1em, color: color) }                           // 有序列表图标
    else if type in ("quote", "cite") { octique("quote", width: 1em, color: color) }                         // 引号图标
    else { ">" }
  
  block(
    width: 100%,    // 块宽度占满容器
    fill: color.lighten(90%),    // 背景色，使用对应类型的颜色的90%亮度版本
    stroke: (left: 2pt + color), // 左边框，2pt粗细，使用对应类型的颜色
    inset: (
      left: 0.5em,    // 左内边距
      right: 0.5em,   // 右内边距
      top: 0.5em,   // 上内边距
      bottom: 0.5em // 下内边距
    ),
    radius: 5pt,    // 圆角半径
    spacing: 0.1em, // 块内元素（如标题和正文）之间的间距
    above: 0.5em,   // 此块与上方内容的间距
    below: 0.5em,   // 此块与下方内容的间距
    [
      // 使用 align 和 box 的 baseline 属性来实现图标和标题的垂直居中对齐
      #box(icon, baseline: 15%) 
      #if title != none {
        [#text(title, fill: color, weight: "extrabold") #linebreak()] //[#title #linebreak()]
      }
      #body
    ]
  )
}

// 先保存内置的 underline 引用，以便包装而不丢失自动换行能力
#let underline__builtin = underline

// 重定义下划线命令，新增 hide 属性用于隐藏正文内容，保持原生换行与布局
// - hide: 为 true 时隐藏正文（通过将文字透明化），但仍按正文长度与换行绘制下划线
// - show_content: 兼容旧参数；若传入 hide 则以 hide 优先
#let underline(
  body,
  stroke: 0.6pt+black,
  offset: 2pt,
  evade: false, // 是否避开文字
  show_content: true,    // 是否显示正文内容
  line_break: false,      // 新增：为 true 时创建多行填空效果
) = {
  let content_to_show = if show_content { body } else { text(fill: rgb(0, 0, 0, 0))[#body] }
  
  // 使用内置 underline 以保留自动换行
  // fill_line=true 时，自动计算行数并创建多行填空效果
  if line_break and not show_content {
    context {
      // 准备要显示的内容
      let content_to_show = if show_content { body } else { text(fill: rgb(0, 0, 0, 0))[#body] }
      
      // 使用layout来获取容器宽度并进行测量
      layout(size => {
        let container_width = size.width
        
        // 简单直接：文本宽度除以容器宽度，向上取整得到行数
        let measured = measure(content_to_show)
        let calculated_lines = calc.max(1, calc.ceil(measured.width / container_width))
        let line_height = 1em  // 固定行高
        
        // 调试信息：显示计算结果
        // [文本宽度: #measured.width, 容器宽度: #container_width, 行数: #calculated_lines] 
        // linebreak()
        
        // 创建多行填空布局
        stack(
          dir: ttb,
          spacing: line_height,
          ..range(calculated_lines).map(i => {
            stack(
              dir: ttb,
              spacing: offset,
              // 只在第一行显示内容
              v(line_height),
              line(length: 100%, stroke: stroke)
            )
          })
        )
      })
    }
  } else if line_break {
    // set par(justify: true)
    linebreak()
    underline__builtin(stroke: stroke, offset: offset, evade: evade)[#content_to_show]
  } else {
    // underline__builtin(stroke: stroke, offset: offset, evade: evade)[#content_to_show]
      context {
        let thickness = 0.6pt
        let stroke = black
    let size = measure(content_to_show)
    box(
      baseline: offset, // 设置box的基线位置与文字对齐
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

