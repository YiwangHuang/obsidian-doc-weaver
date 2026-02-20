// Touying slides framework; see https://touying-typ.github.io/
// Touying 幻灯片框架
#import "@preview/touying:0.6.1": *

// Metropolis theme; see https://touying-typ.github.io/zh/docs/themes/metropolis/
// Metropolis 主题
#import themes.metropolis: *

// Heading numbering (numbly)
// 标题编号
#import "@preview/numbly:0.1.0": numbly

// Doc Weaver custom styles (callout, DW_underline, etc.), shared with article template
// Doc Weaver 自定义格式（callout、DW_underline 等），与文章模板共用
#import "DW_styles.typ": *

// LaTeX math support (inline #mi, block #mitex)
// 支持 LaTeX 公式
#import "@preview/mitex:0.2.5": *

// Markdown-style tables
// 支持 Markdown 风格表格
#import "@preview/tablem:0.3.0": tablem

// Toggle whether underline shows content (true = show; false = blank/fill-in)
// 切换下划线是否显示内容（true 显示，false 为填空）
#let DW_underline = DW_underline.with(show_content: true)

// Default gutter for grid layout
// 分栏（grid）默认间距
#let grid = grid.with(gutter: 1em)

// Main slides entry: applies Metropolis theme, title slide, and body
// 幻灯片主入口：应用 Metropolis 主题、标题页与正文
#let DW_slides(
  title: "Title",
  subtitle: "Subtitle",
  author: "Author",
  date: datetime.today(),
  institution: "Institution",
  logo: none,
  doc,
) = {

  // Strong (bold) text style
  // 重点强调文本样式
  show strong: it => text(
    weight: "bold",
    fill: red.darken(20%),
    it.body
  )

  // Emphasis (italic) text style
  // 强调文本样式
  show emph: it => text(
    fill: purple.darken(20%),
    style: "italic",
    it.body
  )

  // Center images by default
  // 图片默认居中
  show image: it => align(center, it)

  // Heading numbering (section.subsection)
  // 标题编号
  set heading(numbering: numbly("{1}.", default: "1.1"))

  // Theme: Metropolis (aspect ratio, footer, title slide info)
  // 主题配置：Metropolis（比例、页脚、标题页信息）
  show: metropolis-theme.with(
    aspect-ratio: "16-9",
    footer: self => self.info.institution,
    config-info(
      title: title,
      subtitle: subtitle,
      author: author,
      date: date,
      institution: institution,
      logo: logo,
    ),
    config-methods(
      init: (self: none, body) => {
        // Base text: Latin/digit font and size for slides
        // 基础文字：幻灯片用西文/数字字体与字号
        set text(
          font: (
            (name: "Times New Roman", covers: "latin-in-cjk"),
            (name: "Times New Roman", covers: regex("[0-9]")),
          ),
          size: 20pt
        )
        body
      }
    ),
    // handout: true disables animations (e.g. #pause)
    // handout: true 时关闭动画（如 #pause）
    config-common(handout: false)
  )

  title-slide()

  doc
}
