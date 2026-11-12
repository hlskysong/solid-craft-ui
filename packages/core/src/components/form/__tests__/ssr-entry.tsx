/**
 * T2-08 SSR 入口：验「服务端输出完整表单骨架 + 状态属性两态稳定」。
 *
 * 三个表单分别覆盖 horizontal / vertical / inline，四个字段覆盖必填标记、
 * 禁用合并与 label 三件套。校验只在提交时跑，所以服务端**不输出**错误文案节点；
 * `counts` 把这一点钉死，避免有人把校验搬进渲染期造成 hydration 属性差。
 *
 * 不进 `dist`、不进 npm 包：`collect-sources` 与 `tsconfig.build.json` 排除 `__tests__`。
 */
import { renderToString } from 'solid-js/web';

import { useFormFieldOptional } from '../../../form/use-form-field';
import { Form } from '../Form';

function SsrProbe() {
  const field = useFormFieldOptional();
  return <input {...field?.aria()} value="" />;
}

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <Form layout="horizontal" initialValues={{ username: '', email: '' }} aria-label="员工信息">
        <Form.Item name="username" label="姓名" rules={[{ required: true }]}>
          <SsrProbe />
        </Form.Item>
        <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
          <SsrProbe />
        </Form.Item>
      </Form>
      <Form layout="vertical" initialValues={{ city: '' }} aria-label="城市信息">
        <Form.Item name="city" label="城市">
          <SsrProbe />
        </Form.Item>
      </Form>
      <Form layout="inline" disabled initialValues={{ note: '' }} aria-label="备注信息">
        <Form.Item name="note" label="备注">
          <SsrProbe />
        </Form.Item>
      </Form>
    </div>
  ));
}
