import path from 'path';

export function ensureRelativePath(p: string) {
    // 如果路径不是绝对路径且不以./或../开头
    if (!path.isAbsolute(p) && !p.startsWith('./') && !p.startsWith('../')) {
      return './' + p;
    }
    return p;
  }