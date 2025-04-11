# 跨平台路径处理与Typst集成指南

## 1. 路径处理核心概念

### Path.resolve 函数

`path.resolve()` 是 Node.js 中用于将路径片段解析为绝对路径的函数。

```javascript
const path = require('path');

// 基本用法
console.log(path.resolve('/foo/bar', './baz')); // 输出: '/foo/bar/baz'

// 从当前目录开始的相对路径
console.log(path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif'));
// 如果当前目录是 /home/user，输出: '/home/user/wwwroot/static_files/gif/image.gif'
```

### 跨平台路径差异

不同操作系统的路径表示存在差异：
- Windows: 使用反斜杠 `\`，支持驱动器前缀（如 `C:`）
- macOS/Linux: 使用正斜杠 `/`，根目录从 `/` 开始

## 2. 多平台路径适配策略

### 使用 path 模块处理路径分隔符

```javascript
const path = require('path');

// 使用系统特定的分隔符
console.log(`系统路径分隔符: ${path.sep}`); // Windows: \ | Unix: /

// 标准化用户输入路径
const systemPath = path.normalize(userPath);
```

### 处理特殊路径和环境变量

```javascript
const os = require('os');

// 解析波浪号(~)为用户主目录
function expandHomeDir(inputPath) {
  if (inputPath.startsWith('~')) {
    return path.join(os.homedir(), inputPath.slice(1));
  }
  return inputPath;
}

// 解析环境变量
function expandEnvVars(inputPath) {
  // Windows 格式 %VAR%
  if (process.platform === 'win32') {
    return inputPath.replace(/%([^%]+)%/g, (_, varName) => process.env[varName] || '');
  }
  // Unix 格式 $VAR 或 ${VAR}
  return inputPath.replace(/\$(\w+)|\$\{([^}]+)\}/g, (_, varName1, varName2) => {
    const varName = varName1 || varName2;
    return process.env[varName] || '';
  });
}
```

### 统一的路径处理函数

```javascript
function processUserPath(userPath, options = {}) {
  const { 
    base = process.cwd(), 
    resolveHome = true, 
    resolveEnv = true, 
    toAbsolute = true 
  } = options;
  
  // 处理空值
  if (!userPath) return base;
  
  // 展开特殊路径标记
  let processedPath = userPath;
  if (resolveHome) processedPath = expandHomeDir(processedPath);
  if (resolveEnv) processedPath = expandEnvVars(processedPath);
  
  // 标准化路径
  processedPath = path.normalize(processedPath);
  
  // 转换为绝对路径(如需要)
  if (toAbsolute && !path.isAbsolute(processedPath)) {
    processedPath = path.resolve(base, processedPath);
  }
  
  return processedPath;
}
```
