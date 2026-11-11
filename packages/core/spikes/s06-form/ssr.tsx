import { renderToString } from 'solid-js/web';

import { ScuiForm, ScuiFormItem, ScuiFormSubmit } from './Form';
import { required } from './validation';

export async function render(): Promise<string> {
  return renderToString(() => (
    <ScuiForm
      initialValues={{ name: '', email: '' }}
      rules={{ name: [required()], email: [required()] }}
      label="预研表单"
    >
      <ScuiFormItem name="name" label="姓名" />
      <ScuiFormItem name="email" label="邮箱" />
      <ScuiFormSubmit>保存</ScuiFormSubmit>
    </ScuiForm>
  ));
}
