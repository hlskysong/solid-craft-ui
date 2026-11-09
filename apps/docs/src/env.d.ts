/// <reference types="vite/client" />

/** TS 7 对无声明的样式副作用导入会报 TS2882。 */
declare module '*.css';

/** Vite ?raw：与 Demo 模块同一路径的源码文本。 */
declare module '*?raw' {
  const source: string;
  export default source;
}
