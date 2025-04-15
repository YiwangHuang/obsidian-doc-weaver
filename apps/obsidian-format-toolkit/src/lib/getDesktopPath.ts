import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';  // 使用 fs 的 promise 版本

/**
 * 定义返回结果的接口
 */
interface DesktopPathResult {
    path: string;
    exists: boolean;
}

/**
 * 获取桌面路径
 * @returns Promise<DesktopPathResult> 包含桌面路径和路径是否存在的对象
 */
export async function getDesktopPath(): Promise<DesktopPathResult> {
    const platform = process.platform;
    const homeDir = os.homedir();
    
    try {
        switch (platform) {
            case 'win32':
            case 'darwin': {
                const desktopPath = path.join(homeDir, 'Desktop');
                const exists = await fs.access(desktopPath)
                    .then(() => true)
                    .catch(() => false);
                return { path: desktopPath, exists };
            }
            
            case 'linux': {
                // 先尝试英文路径
                const englishPath = path.join(homeDir, 'Desktop');
                const englishExists = await fs.access(englishPath)
                    .then(() => true)
                    .catch(() => false);
                
                if (englishExists) {
                    return { path: englishPath, exists: true };
                }
                
                // 再尝试中文路径
                const chinesePath = path.join(homeDir, '桌面');
                const chineseExists = await fs.access(chinesePath)
                    .then(() => true)
                    .catch(() => false);
                
                return {
                    path: chineseExists ? chinesePath : englishPath,
                    exists: chineseExists
                };
            }
            
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    } catch (error) {
        throw new Error(`Failed to get desktop path: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// // 使用示例
// async function example() {
//     try {
//         const result = await getDesktopPath();
//         console.log('Desktop path:', result.path);
//         console.log('Path exists:', result.exists);
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }