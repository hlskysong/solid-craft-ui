/**
 * T2-08 校验引擎：把 docs/04 §5.2 P0 的六种规则收敛成一处纯函数。
 *
 * 两条口径：
 *  - 空值只由 `required` 管。没有 required 时，空值不做 type / min / max / pattern 校验，
 *    否则「非必填的输入框一提交就报格式错误」；自定义 validator 仍会执行（它可能就是
 *    用来判空值之外的业务规则的，但按 §5.2 的顺序排在静态规则之后）。
 *  - 静态规则按数组顺序短路，自定义规则并发执行后仍按数组顺序取第一条失败。
 *    这样既保留「第一条失败文案」的确定性，也避免在循环里 await 触发 lint 规则。
 */
import type { FormRule, FormValues } from './types';

const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

/**
 * 只对能安全字符串化的值取文本；对象 / 数组 / null 一律按空串处理，
 * 避免 `String({})` 得到 `[object Object]` 让 email / url / pattern 误判。
 */
const asText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
};

/** 数值直接比较，字符串与数组比较长度，其余类型不参与 min / max。 */
const extent = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' || Array.isArray(value)) return value.length;
  return undefined;
};

const matchesType = (value: unknown, type: string): boolean => {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !Number.isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(asText(value));
    case 'url': {
      try {
        new URL(asText(value));
        return true;
      } catch {
        return false;
      }
    }
    default:
      return true;
  }
};

const failure = (rule: FormRule, fallback: string): string => rule.message ?? fallback;

function checkStatic(rule: FormRule, value: unknown): string | undefined {
  if (rule.required && isEmpty(value)) return failure(rule, '此项为必填项');
  if (isEmpty(value)) return undefined;
  if (rule.type && !matchesType(value, rule.type)) return failure(rule, `类型应为 ${rule.type}`);

  const size = extent(value);
  if (rule.min !== undefined && size !== undefined && size < rule.min) {
    return failure(rule, `不得小于 ${rule.min}`);
  }
  if (rule.max !== undefined && size !== undefined && size > rule.max) {
    return failure(rule, `不得大于 ${rule.max}`);
  }
  if (rule.pattern) {
    // 每次新建，避免调用方复用同一个 /g 正则时 lastIndex 让结果在两次提交间漂移。
    const flags = rule.pattern.flags.replace(/[gy]/g, '');
    if (!new RegExp(rule.pattern.source, flags).test(asText(value))) {
      return failure(rule, '格式不正确');
    }
  }
  return undefined;
}

async function checkValidator(
  rule: FormRule,
  value: unknown,
  values: FormValues,
): Promise<string | undefined> {
  if (!rule.validator) return undefined;
  const result = await rule.validator(value, values);
  return result === undefined ? undefined : failure(rule, result);
}

/** 执行一个字段的全部规则，返回第一条失败文案；全部通过时返回 `undefined`。 */
export async function runRules(
  rules: readonly FormRule[],
  value: unknown,
  values: FormValues,
): Promise<string | undefined> {
  for (const rule of rules) {
    const staticFailure = checkStatic(rule, value);
    if (staticFailure !== undefined) return staticFailure;
  }
  const results = await Promise.all(rules.map((rule) => checkValidator(rule, value, values)));
  return results.find((result) => result !== undefined);
}
