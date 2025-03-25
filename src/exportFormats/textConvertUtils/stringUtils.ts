// Obsidian Markdown 到 Quarto Markdown 的转换工具
/**
 * 将 Obsidian Markdown 内容转换为 Quarto Markdown 格式
 * @param contentToConvert - 需要转换的 Obsidian Markdown 内容
 * @returns 转换后的 Quarto Markdown 内容
 */
export function convertMDtoQMD(contentToConvert: string): string {
  let newContent = toMarkdownLink(contentToConvert);
  if (!newContent.endsWith("\n")) newContent += "\n";
  newContent = adjustCodeBlock(newContent);
  newContent = colConvertFull(callConvertFull(newContent));
  return newContent;
}

/**
 * 将 Obsidian 的 WikiLink 图片引用格式转换为标准 Markdown 格式
 * @param text - 包含 WikiLink 格式图片引用的文本
 * @returns 转换后的标准 Markdown 格式文本
 */
function toMarkdownLink(text: string): string {
  text = text.replace(/!\[\[([^\|]+?\.(?:png|jpeg|jpg|gif|mp4))\]\]/g, "![](./assets/$1)");
  text = text.replace(
    /!\[\[([^\|]+?\.(?:png|jpeg|jpg|gif|mp4))\|(\d+?)\]\]/g,
    "![](./assets/$1){width=$2}"
  );
  text = text.replace(
    /!\[\[([^\|]+?\.(?:png|jpeg|jpg|gif|mp4))\|(.+?)\]\]/g,
    "![$2](./assets/$1)"
  );
  return text;
}

/**
 * 调整代码块的语言标注格式
 * @param text - 包含代码块的文本
 * @returns 转换后的文本
 */
function adjustCodeBlock(text: string): string {
  text = text.replace(/```(js|python|mermaid)/g, "```{$1}");
  return text;
}

/**
 * 处理文本中的所有 Callout 块
 * @param fullText - 包含 Callout 块的完整文本
 * @returns 转换后的文本
 */
function callConvertFull(fullText: string): string {
  const regex = /^[\t ]*> *?\[!(.+)\]([\+\-]{0,1})(.*)\n((?:[\t ]*>.*\n)*)/gm;
  return segmentSelect(fullText, regex, callConvertPart);
}

/**
 * 转换单个 Callout 块
 * @param matchArr - 正则表达式匹配结果数组
 * @returns 转换后的 Quarto callout 格式文本
 */
function callConvertPart(matchArr: RegExpMatchArray): string {
  const calloutType = matchArr[1].toLowerCase();
  const calloutCollapse = matchArr[2];
  const calloutTitle = matchArr[3].trim();
  const calloutText = matchArr[4];
  const contentArr: string[] = [];

  const ignoreTypes = ["info", "todo"];
  if (ignoreTypes.includes(calloutType)) {
    return "";
  }

  const regex = /[\t ]*^>(.*)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(calloutText)) !== null) {
    contentArr.push(match[1].trim());
  }
  const convertedText = contentArr.join("\n");
  
  let convertedHead = `.callout-${calloutType}`;
  if (calloutTitle !== "") {
    convertedHead = convertedHead.concat(` title="${calloutTitle}"`);
  }

  switch (calloutCollapse) {
    case "+":
      convertedHead = convertedHead.concat(" collapse=false");
      break;
    case "-":
      convertedHead = convertedHead.concat(" collapse=true");
      break;
  }

  return `::: {${convertedHead}}\n${convertedText}\n:::\n`;
}

/**
 * 处理文本中的所有多列布局块
 * @param fullText - 包含多列布局的完整文本
 * @returns 转换后的文本
 */
function colConvertFull(fullText: string): string {
  const reg = /--- *?start-multi-column((?:.|[\r\n])*?)--- *?end-multi-column.*/g;
  return segmentSelect(fullText, reg, colConvertPart);
}

/**
 * 转换单个多列布局块
 * @param matchArr - 正则表达式匹配结果数组
 * @returns 转换后的 Quarto 多列格式文本
 */
function colConvertPart(matchArr: RegExpMatchArray): string {
  const partText = matchArr[0];
  
  const regexStart = /---\s*start-multi-column: *?(.*)\n+```column-settings.*?\n([\s\S]*?)\n``` *?\n/;
  const regexBreak = /((?:.|[\r\n])*?)\n *?--- *?column-break *?--- *?/;
  const regexEnd = /((?:.|[\r\n])*?)\n *?--- *?end-multi-column.*?/;

  interface ColumnProperties {
    ID?: string;
    colNum?: number;
    colSize?: string;
  }

  const colProp: ColumnProperties = {};
  const colProp_: { [key: string]: string } = {};
  const colNumList = ["number_of_columns", "num_of_cols", "col_count"];
  const colSizeList = ["column_size", "col_size", "column_width", "col_width", "largest_column"];

  const matches = partText.match(regexStart);
  if (matches) {
    colProp.ID = matches[1].trim();
    const columnSettings = matches[2].split("\n").map((line) => line.trim());
    
    columnSettings.forEach((line) => {
      const [key, value] = line.split(":");
      colProp_[key.trim().replace(/\s/g, "_").toLowerCase()] = value.trim();
    });

    for (const key of colNumList) {
      if (colProp_.hasOwnProperty(key)) {
        colProp.colNum = parseInt(colProp_[key]);
        break;
      }
    }

    for (const key of colSizeList) {
      if (colProp_.hasOwnProperty(key)) {
        colProp.colSize = colProp_[key];
        break;
      }
    }
  }

  if (!colProp.colNum) return partText;

  const regexList = [regexStart, regexBreak, regexEnd].map((ele) => ele.source);
  const regexTotalStr = regexList[0] + repeatStr(regexList[1], colProp.colNum - 1) + regexList[2];
  const regexTotal = new RegExp(regexTotalStr);
  const segments = partText.match(regexTotal)?.slice(3) || [];

  const colRatios = colProp.colSize
    ? colProp.colSize.slice(1, -1).split(",").map((value) => value.trim())
    : [];

  const sumOfPreviousItems = colRatios
    .slice(0, colProp.colNum - 1)
    .reduce((accumulator, currentValue) => {
      return accumulator + parseFloat(currentValue);
    }, 0);
  
  const adjustedLastValue = 100 - sumOfPreviousItems;
  if (colRatios.length >= colProp.colNum) {
    colRatios[colProp.colNum - 1] = `${adjustedLastValue}%`;
  }

  const breaks = [
    `\n:::: {.columns}\n\n::: {.column width="${colRatios[0]}"}\n`,
  ];
  for (let i = 1; i < colProp.colNum; i++) {
    breaks.push(`\n:::\n\n::: {.column width="${colRatios[i]}"}`);
  }
  breaks.push("\n:::\n::::\n");

  return interleaveArrays(breaks, segments).join("");
}

/**
 * 将文本按特定模式分段并处理
 */
function segmentSelect(text: string, regex: RegExp, operateFun: (match: RegExpMatchArray) => string): string {
  const segments: string[] = [];
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const precedingText = text.substring(lastIndex, matchIndex);
    if (precedingText !== "") {
      segments.push(precedingText);
    }
    segments.push(operateFun(match));
    lastIndex = matchIndex + match[0].length;
  }

  const remainingText = text.substring(lastIndex);
  if (remainingText !== "") {
    segments.push(remainingText);
  }
  return segments.join("");
}

/**
 * 将两个数组的元素交错组合成一个新数组
 */
function interleaveArrays(arr1: string[], arr2: string[]): string[] {
  const result: string[] = [];
  const maxLength = Math.max(arr1.length, arr2.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < arr1.length) {
      result.push(arr1[i]);
    }
    if (i < arr2.length) {
      result.push(arr2[i]);
    }
  }
  return result;
}

/**
 * 将字符串重复指定次数
 */
function repeatStr(str: string, repeatTimes: number): string {
  return str.repeat(repeatTimes);
} 