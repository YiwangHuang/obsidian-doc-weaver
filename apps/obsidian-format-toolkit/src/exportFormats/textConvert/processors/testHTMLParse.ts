import { parse } from 'html-parse-string';

// 使用 npx tsx + 路径 进行测试

const html = `<u class="test" color="red">`;//hello</u>
const parsed = parse(html);
console.log(parsed, parsed[0].attrs);