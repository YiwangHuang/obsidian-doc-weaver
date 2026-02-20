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

/**
 * 生成当前时间的时间戳
 * @param format 时间戳格式，'decimal'为十进制，'hex'为十六进制，默认为十进制
 * @returns 当前时间的时间戳字符串
 */
export function generateTimestamp(format: 'decimal' | 'hex' = 'decimal'): string {
    // 获取当前时间的毫秒时间戳
    const timestamp = Date.now();
    
    // 根据指定格式返回时间戳
    if (format === 'hex') {
        // 转换为十六进制并去掉前缀'0x'
        return timestamp.toString(16);
    } else {
        // 返回十进制时间戳
        return timestamp.toString();
    }
}
