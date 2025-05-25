import path from 'path';
import * as fs from 'fs';

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
      const fullPath = path.join(dirPath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
          // 递归读取子目录
          const subFiles = readDirRecursively(fullPath, baseDir);
          Object.assign(files, subFiles);
      } else {
          // 读取文件内容
          const relativePath = path.relative(baseDir, fullPath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          files[relativePath] = content;
      }
  }
  return files;
}