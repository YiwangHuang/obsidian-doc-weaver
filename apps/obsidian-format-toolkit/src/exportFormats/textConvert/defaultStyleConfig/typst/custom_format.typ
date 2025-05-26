#import "@preview/octique:0.1.0": * //支持Octicons图标,https://primer.style/octicons/

// 定义 callout 格式, collapse 属性备用
#let callout(type: "note", title: none, collapse: none, body) = {
  // 定义哪些类型应该被隐藏
  let hidden_types = ("hidden", "hide", "none")
  
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

// 重定义下划线命令
#let underline(
  body,
  stroke: black,
  offset: 2pt,
  thickness: 0.6pt,
  show_content: true, // 控制是否显示内容文字，用于挖空
) = {
  context {
    let size = measure(body)
    box(
      baseline: offset, // 设置box的基线位置与文字对齐
      stack(
        dir: ttb,
        spacing: offset,
        if show_content { body } else { [] },
        line(
          length: size.width,
          stroke: (thickness + stroke)
        )
      )
    )
  }
}

