// import * as typst from 'typst';
// import * as fs from 'fs';
// import * as path from 'path';

// /**
//  * Typst 编译结果接口
//  */
// export interface TypstCompileResult {
//     success: boolean;
//     inputFile: string;
//     outputFile: string;
//     error?: string;
// }

// /**
//  * 编译 Typst 文件为 PDF
//  * @param inputPath 输入的 .typ 文件路径
//  * @param outputPath 输出的 PDF 文件路径
//  * @returns 编译结果
//  */
// export async function compileTypstToPdf(
//     inputPath: string, 
//     outputPath: string
// ): Promise<TypstCompileResult> {
//     try {
//         // 检查输入文件是否存在
//         if (!fs.existsSync(inputPath)) {
//             return {
//                 success: false,
//                 inputFile: inputPath,
//                 outputFile: outputPath,
//                 error: `输入文件不存在: ${inputPath}`
//             };
//         }

//         // 确保输出目录存在
//         const outputDir = path.dirname(outputPath);
//         if (!fs.existsSync(outputDir)) {
//             fs.mkdirSync(outputDir, { recursive: true });
//         }

//         // 执行编译
//         await typst.compile(inputPath, outputPath);
        
//         // 检查输出文件是否生成成功
//         if (!fs.existsSync(outputPath)) {
//             return {
//                 success: false,
//                 inputFile: inputPath,
//                 outputFile: outputPath,
//                 error: '编译完成但未生成输出文件'
//             };
//         }

//         return {
//             success: true,
//             inputFile: inputPath,
//             outputFile: outputPath
//         };

//     } catch (error) {
//         return {
//             success: false,
//             inputFile: inputPath,
//             outputFile: outputPath,
//             error: error instanceof Error ? error.message : String(error)
//         };
//     }
// } 