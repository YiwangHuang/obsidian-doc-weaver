// ==================== 列表编号配置 ====================

// 1. 基础数字编号（1. 2. 3.）
#let basic_numbering = numbering("1.")

// 2. 带括号的数字编号 ((1) (2) (3))
#let parenthesis_numbering = n => [(#n)]

// 3. 中文数字编号（一、二、三）
#let chinese_numbering = numbering("一、")

// 4. 小写字母编号 (a. b. c.)
#let letter_numbering = numbering("a.")

// 5. 大写字母编号 (A. B. C.)
#let capital_letter_numbering = numbering("A.")

// 6. 罗马数字编号 (i. ii. iii.)
#let roman_numbering = numbering("i.")

// 7. 大写罗马数字编号 (I. II. III.)
#let capital_roman_numbering = numbering("I.")

// 8. 自定义多级列表编号
#let multi_level_numbering = (nums) => {
  let level = nums.len()
  if level == 1 {
    // 第一级：1. 2. 3.
    numbering("1.", nums.at(0))
  } else if level == 2 {
    // 第二级：a) b) c)
    numbering("1." + numbering("a)", nums.at(1)), ..nums)
  } else {
    // 第三级及以上：i. ii. iii.
    numbering("1." + numbering("a)", nums.at(1)) + numbering("i.", nums.at(2)), ..nums)
  }
}

// 9. 带圆圈的编号 (①, ②, ③)
#let circled_numbering = n => {
  let circles = ("①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩")
  if n <= circles.len() {
    circles.at(n - 1)
  } else {
    str(n) + "."
  }
}

// 10. 带方框的编号
#let boxed_numbering = n => {
  box(
    fill: none,
    stroke: 0.5pt,
    inset: 2pt,
    [#n]
  )
}

// ==================== 应用编号样式 ====================

// 设置默认列表样式
#set list(
  // 默认数字编号
  numbering: "1.",
  
  // 或使用自定义编号函数
  // numbering: basic_numbering,
  
  // 调整列表间距
  spacing: 0.65em,
  
  // 调整列表缩进
  indent: 2em,
)

// 示例：使用不同级别的编号样式
#let custom_list_style = (content) => {
  set list(
    numbering: (..nums) => {
      let level = nums.pos().len()
      if level == 1 {
        // 第一级使用数字编号
        basic_numbering(..nums.pos())
      } else if level == 2 {
        // 第二级使用小写字母
        letter_numbering(..nums.pos().last())
      } else {
        // 第三级使用罗马数字
        roman_numbering(..nums.pos().last())
      }
    }
  )
  content
}

// ==================== 使用示例 ====================

/*
使用方法：

1. 基础数字编号：
#set list(numbering: basic_numbering)

2. 带括号的编号：
#set list(numbering: parenthesis_numbering)

3. 中文编号：
#set list(numbering: chinese_numbering)

4. 字母编号：
#set list(numbering: letter_numbering)

5. 罗马数字编号：
#set list(numbering: roman_numbering)

6. 圆圈编号：
#set list(numbering: circled_numbering)

7. 方框编号：
#set list(numbering: boxed_numbering)

8. 多级列表：
#show list: custom_list_style

示例：
+ 第一级
  + 第二级
    + 第三级
*/

// ==================== 高级自定义 ====================

// 自定义前缀和后缀
#let prefix_suffix_numbering = (
  prefix: "Step ",  // 前缀文本
  suffix: ":",      // 后缀文本
  style: "1",       // 编号样式：1, a, A, i, I
) => (n) => {
  prefix + numbering(style, n) + suffix
}

// 条件编号（根据内容长度选择不同样式）
#let conditional_numbering = (n, item) => {
  if item.body.text.len() < 10 {
    // 短项目使用简单编号
    basic_numbering(n)
  } else {
    // 长项目使用带括号的编号
    parenthesis_numbering(n)
  }
}

// 自定义颜色和样式的编号
#let styled_numbering = (
  number_color: blue,
  weight: "bold",
) => (n) => {
  text(
    fill: number_color,
    weight: weight,
    [#n.]
  )
}

/*
高级用法示例：

1. 带前缀后缀：
#set list(numbering: prefix_suffix_numbering(
  prefix: "Task ",
  suffix: ")",
  style: "1"
))

2. 条件编号：
#set list(numbering: conditional_numbering)

3. 带样式的编号：
#set list(numbering: styled_numbering(
  number_color: red,
  weight: "bold"
))
*/
