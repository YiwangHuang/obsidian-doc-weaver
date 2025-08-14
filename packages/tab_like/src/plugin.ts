// 导入HTML转义函数，用于安全地将用户输入转换为HTML
import { escapeHtml } from "@mdit/helper";
// 导入markdown-it相关类型定义
import type { Options, PluginWithOptions } from "markdown-it";
import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";
import type Renderer from "markdown-it/lib/renderer.mjs";
import type Token from "markdown-it/lib/token.mjs";

// 导入本地类型定义
import type {
  MarkdownItTabData,
  MarkdownItTabInfo,
  MarkdownItTabOptions,
} from "./options";

// 定义Tab标记符，用于识别markdown中的tab语法
const TAB_MARKER = `@tab`;

/**
 * 创建Tab规则解析器的工厂函数
 * @param name - Tab容器的名称
 * @param store - 存储当前解析状态的对象
 * @returns RuleBlock - markdown-it的块级规则函数
 */
const getTabRule =
  (name: string, store: { state: string | null }): RuleBlock =>
  (state, startLine, endLine, silent) => {
    // 如果当前状态不匹配，直接返回false
    if (store.state !== name) return false;
    
    // 获取当前行的起始位置和结束位置
    let start = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    /*
     * 快速检查第一个字符，
     * 这可以过滤掉大部分非tab块
     */
    if (state.src.charAt(start) !== "@") return false;

    let index;

    // 检查剩余的标记字符串是否匹配TAB_MARKER
    for (index = 0; index < TAB_MARKER.length; index++)
      if (TAB_MARKER[index] !== state.src[start + index]) return false;

    // 提取标记字符串和信息字符串
    const markup = state.src.slice(start, start + index);
    const info = state.src.slice(start + index, max);

    // 如果处于静默模式（只验证语法），找到开始标记就返回true
    if (silent) return true;

    let nextLine = startLine;
    let autoClosed = false;

    // 搜索块的结束位置
    while (
      // 未闭合的块应该在文档末尾自动闭合
      // 块也可能在父级块结束时自动闭合
      nextLine < endLine
    ) {
      nextLine++;
      start = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      // 如果遇到负缩进的非空行，应该停止列表
      if (start < max && state.sCount[nextLine] < state.blkIndent)
        // 例如：
        // - ```
        //  test
        break;

      if (
        // 匹配开始字符"@"
        state.src[start] === "@" &&
        // 标记的缩进不应该超过开始围栏的缩进
        state.sCount[nextLine] <= state.sCount[startLine]
      ) {
        let openMakerMatched = true;

        // 检查是否完全匹配TAB_MARKER
        for (index = 0; index < TAB_MARKER.length; index++)
          if (TAB_MARKER[index] !== state.src[start + index]) {
            openMakerMatched = false;
            break;
          }

        if (openMakerMatched) {
          // 找到匹配的结束标记！
          autoClosed = true;
          break;
        }
      }
    }

    // 保存当前状态，以便稍后恢复
    const oldParent = state.parentType;
    const oldLineMax = state.lineMax;

    // @ts-expect-error: 我们正在创建一个名为"tab"的新类型
    state.parentType = `tab`;

    // 这将防止延迟续行超出我们的结束标记
    state.lineMax = nextLine - (autoClosed ? 1 : 0);

    // 创建开始token
    const openToken = state.push(`${name}_tab_open`, "", 1);

    // 使用正则表达式解析标题和ID
    // 格式：title#id，其中#id是可选的
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [, title, id] = /^(.*?)(?:(?<!\\)#([^#]*))?$/.exec(
      info.replace(/^:active/, ""), // 移除:active前缀
    )!;

    // 设置token属性
    openToken.block = true;
    openToken.markup = markup;
    openToken.info = title.trim().replace(/\\#/g, "#"); // 处理转义的#字符
    openToken.meta = {
      active: info.includes(":active"), // 检查是否包含:active标记
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (id) openToken.meta.id = id.trim(); // 如果有ID，添加到meta中
    openToken.map = [startLine, nextLine - (autoClosed ? 1 : 0)];

    // 递归解析tab内容
    state.md.block.tokenize(
      state,
      startLine + 1,
      nextLine + (autoClosed ? 0 : 1),
    );

    // 创建结束token
    const closeToken = state.push(`${name}_tab_close`, "", -1);

    closeToken.block = true;
    closeToken.markup = "";

    // 恢复原始状态
    state.parentType = oldParent;
    state.lineMax = oldLineMax;
    state.line = nextLine + (autoClosed ? 0 : 1);

    return true;
  };

/**
 * 创建Tabs容器规则解析器的工厂函数
 * @param name - Tab容器的名称
 * @param store - 存储当前解析状态的对象
 * @returns RuleBlock - markdown-it的块级规则函数
 */
const getTabsRule =
  (name: string, store: { state: string | null }): RuleBlock =>
  (state, startLine, endLine, silent) => {
    // 获取当前行的起始和结束位置
    let start = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    // 快速检查第一个字符，
    // 这应该过滤掉大多数非容器块
    if (state.src[start] !== ":") return false;

    let pos = start + 1;

    // 检查标记字符串的其余部分（连续的冒号）
    while (pos <= max) {
      if (state.src[pos] !== ":") break;
      pos++;
    }

    const markerCount = pos - start;

    // 标记至少需要3个冒号
    if (markerCount < 3) return false;

    // 提取标记和参数
    const markup = state.src.slice(start, pos);
    const params = state.src.slice(pos, max);

    // 解析容器名称和可选的ID
    const [containerName, id = ""] = params.split("#", 2);

    // 检查容器名称是否匹配
    if (containerName.trim() !== name) return false;

    // 如果处于静默模式（只验证语法），找到开始标记就返回true
    if (silent) return true;

    let nextLine = startLine;
    let autoClosed = false;

    // 搜索块的结束位置
    while (
      // 未闭合的块应该在文档末尾自动闭合
      // 块也可能在父级块结束时自动闭合
      nextLine < endLine
    ) {
      nextLine++;
      start = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      // 如果遇到负缩进的非空行，应该停止列表
      if (start < max && state.sCount[nextLine] < state.blkIndent)
        // 例如：
        // - ```
        //  test
        break;

      if (
        // 匹配开始字符":"
        state.src[start] === ":" &&
        // 结束围栏的缩进应该少于4个空格
        state.sCount[nextLine] - state.blkIndent < 4
      ) {
        // 检查标记的其余部分
        for (pos = start + 1; pos <= max; pos++)
          if (state.src[pos] !== ":") break;

        // 结束围栏必须至少与开始围栏一样长
        if (pos - start >= markerCount) {
          // 确保后面只有空格
          pos = state.skipSpaces(pos);

          if (pos >= max) {
            // 找到了！
            autoClosed = true;
            break;
          }
        }
      }
    }

    // 保存当前状态，以便稍后恢复
    const oldParent = state.parentType;
    const oldLineMax = state.lineMax;

    // @ts-expect-error: 我们正在创建一个名为"${name}_tabs"的新类型
    state.parentType = `${name}_tabs`;

    // 这将防止延迟续行超出我们的结束标记
    state.lineMax = nextLine - (autoClosed ? 1 : 0);

    // 创建tabs容器的开始token
    const openToken = state.push(`${name}_tabs_open`, "", 1);

    openToken.markup = markup;
    openToken.block = true;
    openToken.info = containerName;
    openToken.meta = { id: id.trim() }; // 保存容器ID
    openToken.map = [startLine, nextLine - (autoClosed ? 1 : 0)];

    // 保存原始状态并设置新状态，使子tab可以被识别
    const originalState = store.state;

    store.state = name; // 设置状态，允许子tab被解析

    // 递归解析tabs容器内的内容
    state.md.block.tokenize(
      state,
      startLine + 1,
      nextLine - (autoClosed ? 1 : 0),
    );

    // 恢复原始状态
    store.state = originalState;

    // 创建tabs容器的结束token
    const closeToken = state.push(`${name}_tabs_close`, "", -1);

    closeToken.markup = state.src.slice(start, pos);
    closeToken.block = true;

    // 恢复解析器状态
    state.parentType = oldParent;
    state.lineMax = oldLineMax;
    state.line = nextLine + (autoClosed ? 1 : 0);

    return true;
  };

/**
 * 创建获取Tab数据的函数工厂
 * @param name - Tab容器的名称
 * @returns 返回一个函数，该函数从tokens中提取tab信息
 */
const getTabsDataGetter =
  (name: string): ((tokens: Token[], index: number) => MarkdownItTabInfo) =>
  (tokens, index) => {
    const tabData: MarkdownItTabData[] = [];
    let activeIndex = -1; // 当前激活的tab索引
    let isTabStart = false; // 是否已经开始解析tab内容
    let nestingDepth = -1; // 嵌套深度，用于处理嵌套的tab容器

    // 从当前索引开始遍历所有tokens
    for (let i = index; i < tokens.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { block, meta, type, info } = tokens[i];

      if (block) {
        // 处理嵌套的tabs容器开始
        if (type === `${name}_tabs_open`) {
          nestingDepth++;
          continue;
        }

        // 处理嵌套的tabs容器结束
        if (type === `${name}_tabs_close`)
          if (nestingDepth === 0) {
            break; // 找到当前级别的结束，退出循环
          } else {
            nestingDepth--;
            continue;
          }

        // 跳过嵌套层级的tokens
        if (nestingDepth > 0) continue;

        // 处理tab开始token
        if (type === `${name}_tab_open`) {
          isTabStart = true;

          // 设置tab的索引
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          meta.index = tabData.length;

          // 处理激活状态
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (meta.active)
            if (activeIndex === -1) activeIndex = tabData.length; // 设置第一个激活的tab
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            else meta.active = false; // 如果已有激活tab，取消当前tab的激活状态

          // 收集tab数据
          tabData.push({
            title: info,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            index: meta.index as number,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ...(meta.id ? { id: meta.id as string } : {}),
          });

          continue;
        }

        // 跳过tab结束token
        if (type === `${name}_tab_close`) continue;

        // 隐藏tab开始之前的空内容
        if (!isTabStart) {
          tokens[i].type = `${name}_tabs_empty`;
          tokens[i].hidden = true;
        }
      }
    }

    // 返回tab信息，包括激活状态
    return {
      active: activeIndex,
      data: tabData.map((data, index) => ({
        ...data,
        active: index === activeIndex,
      })),
    };
  };

/**
 * 从单个tab token中提取tab数据
 * @param tokens - token数组
 * @param index - 当前token的索引
 * @returns MarkdownItTabData - 单个tab的数据
 */
const tabDataGetter = (tokens: Token[], index: number): MarkdownItTabData => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { info, meta } = tokens[index];

  return {
    title: info, // tab标题
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    index: meta.index as number, // tab索引
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ...(meta.id ? { id: meta.id as string } : {}), // 可选的tab ID
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    isActive: Boolean(meta.active), // 是否为激活状态
  };
};

// 全局状态存储，用于跟踪当前解析状态
const store = { state: null };

/**
 * Tab插件主函数 - 为markdown-it添加tab功能
 * @param md - markdown-it实例
 * @param options - 插件配置选项
 * 
 * 函数调用关系：
 * 1. 注册解析规则：md.block.ruler.before() 调用 getTabsRule() 和 getTabRule()
 * 2. 设置渲染器：md.renderer.rules 设置各种渲染函数
 * 3. 解析过程：getTabsRule/getTabRule -> state.push() 创建tokens -> 渲染器处理tokens
 * 4. 数据提取：tabsDataGetter() 和 tabDataGetter() 从tokens中提取结构化数据
 */
export const tab: PluginWithOptions<MarkdownItTabOptions> = (md, options) => {
  const {
    // 默认容器名称
    name = "tabs",

    // Tabs容器开始渲染器 - 渲染tab按钮头部和容器开始
    tabsOpenRenderer = (
      info: MarkdownItTabInfo,
      tokens: Token[],
      index: number,
      _options: Options,
      _env: unknown,
      self: Renderer,
    ): string => {
      const { active, data } = info;
      const token = tokens[index];

      // 设置容器CSS类和可选的data-id属性
      token.attrJoin("class", `${name}-tabs-wrapper`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (token.meta.id) token.attrJoin("data-id", token.meta.id as string);

      // 生成tab按钮HTML
      const tabs = data.map(
        ({ title, id }, index) =>
          `<button type="button" class="${name}-tab-button${
            active === index ? " active" : ""
          }" data-tab="${index}"${id ? ` data-id="${escapeHtml(id)}"` : ""}${
            active === index ? " data-active" : ""
          }>${escapeHtml(title)}</button>`,
      );

      // 返回tabs容器开始HTML
      return `\
<div${self.renderAttrs(token)}>
  <div class="${name}-tabs-header">
    ${tabs.join("\n    ")}
  </div>
  <div class="${name}-tabs-container">\n`;
    },

    // Tabs容器结束渲染器
    tabsCloseRenderer = (): string => `
  </div>
</div>`,

    // 单个Tab开始渲染器 - 渲染tab内容容器开始
    tabOpenRenderer = (
      info: MarkdownItTabData,
      tokens: Token[],
      index: number,
      _options: Options,
      _env: unknown,
      self: Renderer,
    ): string => {
      const token = tokens[index];

      // 设置tab内容的CSS类和属性
      token.attrJoin(
        "class",
        `${name}-tab-content${info.isActive ? " active" : ""}`,
      );
      token.attrSet("data-index", info.index.toString());
      if (info.id) token.attrSet("data-id", info.id.toString());

      if (info.isActive) token.attrJoin("data-active", "");

      return `<div${self.renderAttrs(tokens[index])}>`;
    },

    // 单个Tab结束渲染器
    tabCloseRenderer = (): string => `</div>`,
  } = options ?? {};

  // 创建tabs数据获取器
  const tabsDataGetter = getTabsDataGetter(name);

  // 注册块级解析规则 - tabs容器规则，在fence规则之前处理
  md.block.ruler.before("fence", `${name}_tabs`, getTabsRule(name, store), {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  // 注册块级解析规则 - 单个tab规则，在paragraph规则之前处理
  md.block.ruler.before("paragraph", `${name}_tab`, getTabRule(name, store), {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  // 设置tabs容器开始的渲染规则
  md.renderer.rules[`${name}_tabs_open`] = (
    tokens,
    index,
    options,
    env,
    self,
  ): string => {
    // 获取结构化的tab信息
    const info = tabsDataGetter(tokens, index);

    return tabsOpenRenderer(info, tokens, index, options, env, self);
  };

  // 设置tabs容器结束的渲染规则
  md.renderer.rules[`${name}_tabs_close`] = tabsCloseRenderer;

  // 设置单个tab开始的渲染规则
  md.renderer.rules[`${name}_tab_open`] = (tokens, index, ...args): string => {
    // 获取单个tab的数据
    const data = tabDataGetter(tokens, index);

    return tabOpenRenderer(data, tokens, index, ...args);
  };

  // 设置单个tab结束的渲染规则
  md.renderer.rules[`${name}_tab_close`] = tabCloseRenderer;
};
