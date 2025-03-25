/**
 * 生成指定位数的16进制随机ID
 * @param length 要生成的16进制ID的位数，默认为6位
 * @returns 指定位数的16进制随机ID字符串
 */
export function generateHexId(length = 6): string {
    // 计算需要的最大值，例如6位需要0xFFFFFF，8位需要0xFFFFFFFF
    const maxValue = Math.pow(16, length) - 1;
    // 生成随机数并转换为16进制
    return Math.floor(Math.random() * maxValue).toString(16).padStart(length, '0');
}
