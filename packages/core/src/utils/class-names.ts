/** 合并静态类名；变体 / 尺寸 / 状态一律用 data-* 属性，不生成 modifier class。 */
export function classNames(...values: Array<string | false | null | undefined>): string {
  return values
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ');
}
