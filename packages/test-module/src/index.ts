/**
 * 简单的工具函数，供测试 monorepo 结构使用
 */

/**
 * 将两个数相加
 * @param a 第一个数
 * @param b 第二个数
 * @returns 两数之和
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * 导出默认函数，也是 add 函数
 */
export default add; 