#import "@preview/octique:0.1.0": * //支持Octicons图标,https://primer.style/octicons/

// 定义 callout 格式, collapse 属性备用
#let callout(type: "note", title: none, collapse: none, hidden_types: (), body) = {
  // 如果type在hidden_types中，返回空内容
  if type in hidden_types { return [] }

  let color = if  type == "done" { rgb("#27ad27") } // 使用深绿色 (Dark Green)
    else if type == "question" { orange }
    else if type == "danger" { red }
    else if type == "tip"or type == "note"  { blue }
    else if type == "info" { purple }
    else { gray }

  let icon = if type == "note" { "ℹ" }
    // else if type == "warning" { image("alert-circle.svg", height:0.9em) }
    else if type == "question" { octique("question", width: 1em, color: color) }
    else if type == "tip" { octique("light-bulb", width: 1em, color: color) } //  bell-fill
    else if type == "info" { octique("pencil", width: 1em, color: color) } //  bookmark
    else if type == "done" { octique("check-circle", width: 1em, color: color) }
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
  fill_line: false,      // 新增：为 true 时创建多行填空效果
) = {
  let content_to_show = if show_content { body } else { text(fill: rgb(0, 0, 0, 0))[#body] }
  
  // 使用内置 underline 以保留自动换行
  // fill_line=true 时，自动计算行数并创建多行填空效果
  if fill_line and not show_content {
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
  } else if fill_line {
    set par(justify: true)
    underline__builtin(stroke: stroke, offset: offset, evade: evade)[#content_to_show]
  } else {
    underline__builtin(stroke: stroke, offset: offset, evade: evade)[#content_to_show]
  }
}

