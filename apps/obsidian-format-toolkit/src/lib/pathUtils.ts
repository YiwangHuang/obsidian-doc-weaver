import path from 'path';
import * as fs from 'fs';

/**
 * 跨平台路径规范化函数
 * 在Windows系统上将反斜杠转换为正斜杠，在其他系统上保持原有分隔符
 * 所有系统都会进行路径规范化处理（处理 ".."、"."、多余分隔符等）
 * @param inputPath 输入路径，可能包含混合格式的分隔符
 * @returns 规范化后的路径
 */
export function normalizeCrossPlatformPath(inputPath: string): string {
    if (!inputPath) return inputPath;
    
    let processedPath = inputPath;
    
    // 仅在Windows系统上进行分隔符转换
    if (process.platform === 'win32') {
        // 将反斜杠转换为正斜杠，确保Unix格式
        processedPath = inputPath.replace(/\\/g, '/');
    }
    
    // 在所有平台上进行路径规范化
    // Windows: 使用posix.normalize确保Unix格式输出
    // Unix/macOS: 使用posix.normalize处理路径逻辑，保持原有分隔符语义
    const normalizedPath = path.posix.normalize(processedPath);
    
    return normalizedPath;
}

export function ensureRelativePath(p: string) {
    // 如果路径不是绝对路径且不以./或../开头
    if (!path.isAbsolute(p) && !p.startsWith('./') && !p.startsWith('../')) {
      return './' + p;
    }
    return p;
  }

  /**
 * 递归读取目录中的所有文件
 * @param dirPath 目录路径
 * @param baseDir 基础目录（用于生成相对路径）
 * @returns 文件路径和内容的映射对象
 */
export function readDirRecursively(dirPath: string, baseDir: string = dirPath): Record<string, string> {
  const files: Record<string, string> = {};
  
  // 读取目录内容
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
      const fullPath = path.posix.join(dirPath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
          // 递归读取子目录
          const subFiles = readDirRecursively(fullPath, baseDir);
          Object.assign(files, subFiles);
      } else {
          // 读取文件内容
          const relativePath = normalizeCrossPlatformPath(path.relative(baseDir, fullPath));
          const content = fs.readFileSync(fullPath, 'utf-8');
          files[relativePath] = content;
      }
  }
  return files;
}

/**
 * 跨平台路径处理工具使用示例：
 * 
 * // 处理混合格式路径
 * const mixedPath = 'C:\\Users/Documents\\..\\Downloads//file.txt';
 * console.log(normalizeCrossPlatformPath(mixedPath));
 * // 输出: C:/Users/Downloads/file.txt
 * 
 * // 处理配置路径
 * const configPath = normalizeCrossPlatformPath('${VAR_VAULT_DIR}\\output\\exports');
 * console.log(configPath);
 * // 输出: ${VAR_VAULT_DIR}/output/exports
 */