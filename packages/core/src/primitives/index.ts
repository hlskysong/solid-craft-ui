/**
 * 原语层 barrel。
 *
 * ⚠️ 本目录是**内部实现**，不从 `src/index.ts` 导出：
 * 它承载第三方无头库的接缝，属于实现细节而非公共 API；
 * 上层组件（Select / Form / App 等）从 `../../primitives` 引用即可。
 */
export { useClientReady } from './use-client-ready';
export { PrimitiveDialog } from './dialog';
export { PrimitiveSelect } from './select';
export type { PrimitiveDialogProps, PrimitiveOption, PrimitiveSelectProps } from './types';
