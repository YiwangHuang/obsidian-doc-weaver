# Obsidian Format Toolkit Vite构建说明

本项目已从ESBuild迁移到Vite进行构建打包，并使用pnpm作为包管理工具。本文档提供了使用Vite构建系统的相关说明。

## 环境要求

- Node.js >= 14.18.0
- pnpm >= 6.0.0

## 包管理

本项目使用pnpm作为包管理工具，相比npm和yarn，pnpm有以下优势：

1. 磁盘空间使用更高效（使用硬链接共享依赖）
2. 更快的安装速度
3. 更严格的依赖管理，避免幽灵依赖问题

### 常用pnpm命令

- `pnpm install` - 安装项目所有依赖
- `pnpm add <package>` - 添加新依赖
- `pnpm remove <package>` - 移除依赖
- `pnpm update` - 更新所有依赖

## 项目构建命令

项目提供了以下脚本用于构建：

- `pnpm dev` - 开发模式构建，支持监视文件变更并自动重新构建
- `pnpm build` - 生产模式构建，生成优化后的代码
- `pnpm version` - 更新插件版本信息，同时更新manifest.json和versions.json文件

## 目录结构说明

```
obsidian-format-toolkit/
├── main.ts           # 主入口文件
├── main.js           # 构建后的输出文件(被.gitignore忽略)
├── vite.config.ts    # Vite配置文件
├── tsconfig.json     # TypeScript配置
├── package.json      # 项目依赖和脚本配置
├── .npmrc            # npm/pnpm配置文件
├── manifest.json     # Obsidian插件元数据
├── styles.css        # 插件样式
└── src/              # 源代码目录
    ├── lib/          # 通用库和工具函数
    ├── types/        # 类型定义
    ├── exportFormats/# 导出格式相关功能
    └── toggleTagWrapper/ # 标签处理相关功能
```

## 构建配置说明

Vite构建配置文件(`vite.config.ts`)包含以下主要设置：

1. **输入输出配置**:
   - 入口文件: `main.ts`
   - 输出格式: CommonJS (cjs)
   - 输出文件名: `main.js`
   - 输出目录: 项目根目录 (`.`)

2. **外部依赖**:
   - Obsidian API和核心模块设置为外部依赖，不打包进最终代码
   - Node.js内置模块作为外部依赖

3. **优化选项**:
   - 生产环境下启用代码压缩和tree-shaking
   - 开发环境下生成内联sourcemap

## 从ESBuild迁移说明

项目从ESBuild迁移到Vite的主要更改包括：

1. 替换了`esbuild.config.mjs`文件为`vite.config.ts`
2. 更新了package.json中的构建脚本
3. 添加了Vite相关依赖
4. 修改了部分代码中的导入路径，从绝对路径改为相对路径
5. 从npm切换到pnpm作为包管理工具

## 导入路径规范

在此项目中，所有模块导入应使用相对路径而非绝对路径。例如：

```typescript
// 正确的导入方式（相对路径）
import { getHeadingText } from '../../../lib/noteResloveUtils';

// 避免使用的导入方式（绝对路径）
// import { getHeadingText } from 'src/lib/noteResloveUtils';
```

这样做是因为Vite与ESBuild处理导入路径的方式不同。Vite默认不会解析以'src/'开头的非相对路径导入，所以需要使用相对路径来确保构建正常。

## 常见问题解决

1. **导入路径问题**:
   - 如果出现模块解析错误，请检查是否使用了绝对路径导入，应改为相对路径导入
   - 确保相对路径的层级关系正确（使用正确数量的`../`）

2. **pnpm相关问题**:
   - 如果遇到依赖冲突问题，可以尝试使用`pnpm install --force`
   - 如果需要忽略某些peer依赖警告，可以在package.json的pnpm部分配置

3. **类型错误**:
   如果遇到Vite相关的类型错误，可查看`src/types/vite.d.ts`文件中的类型声明。

4. **构建失败**:
   - 检查终端输出的具体错误信息
   - 确认所有依赖已正确安装 (`pnpm install`)
   - 确认导入路径是否正确 