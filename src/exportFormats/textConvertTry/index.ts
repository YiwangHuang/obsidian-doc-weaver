import { AdvancedConverter, BaseConverter } from './textConverter';

// 导入所有处理器
import "./processors/paragraphProcessor";
import './processors/InlineFormatProcessor';
import './processors/TableProcessor';
import './processors/CodeBlockProcessor';
import './processors/MutiColumnProcessor';
import './processors/MathProcessor';
import './processors/CalloutProcessor';
import './processors/linkProcessor';

// 导出 TextConverter 类
export { AdvancedConverter as TextConverter, BaseConverter };


import * as url from 'url';

if (import.meta.url === url.pathToFileURL(process.argv[1]).href){
    const text = `
# 标题
## 子标题
- **列表项1**
- *列表项2*

1. 列表项1<br>
2. 列表项2<br>

![[test.png]]

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

\`\`\`python
import numpy as np
np.linspace(0, 1, 10)
\`\`\`

::: col|width(25%,50%,25%)
@col
Content for the first column.
::: info
Nested info block in first column $123$
:::

@col
Content for the second column.

> [!warning]- 这是一个带标题的不可折叠警告块
> 警告内容 $x^2$

@col
Content for the third column.

$$
W_{合}=
\\begin{cases}
F_\\text{合}l\\cos\\alpha \\\\
W_1+W_2+W_3+\\cdots
\\end{cases}
$$

:::
`;
    const converter = new BaseConverter();
    console.log(converter.convert(text));
    // console.log(converter.links);
}