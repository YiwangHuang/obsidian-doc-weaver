declare module 'markdown-it-texmath' {
    import MarkdownIt from 'markdown-it';
    interface Options {
        engine?: unknown;
        delimiters?: string;
    }
    function texmath(md: MarkdownIt, options?: Options): void;
    export default texmath;
} 