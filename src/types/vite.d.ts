// Vite相关类型声明
declare module 'vite' {
  export function defineConfig(config: any): any;
}

// Rollup插件相关类型声明
declare module '@rollup/plugin-node-resolve' {
  export function nodeResolve(options?: { browser?: boolean }): any;
} 