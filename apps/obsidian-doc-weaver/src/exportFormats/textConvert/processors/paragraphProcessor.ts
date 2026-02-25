import { BaseConverter } from '../textConverter';

/**
 * 段落处理器
 * 目的：处理段落格式，保留段落之间的换行
 */
BaseConverter.registerProcessor({
    name: 'paragraphProcessor',
    formats: ['quarto', 'HMD', 'typst', 'latex'],
    description: '处理段落格式',
    mditRuleSetup: (converter: BaseConverter) => {
        // 禁用列表规则
        // converter.md.disable(['list']);

        // 保留html标签
        converter.md.set({html: true});

        // 段落规则
        converter.md.renderer.rules.paragraph_open = () => "";
        converter.md.renderer.rules.paragraph_close = () => "\n\n";
    }
});