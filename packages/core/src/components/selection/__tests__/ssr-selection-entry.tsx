/**
 * 三件套的 SSR 入口（T2-05）。
 *
 * 混渲 Checkbox / CheckboxGroup / RadioGroup / Switch 是有意的：三件套共享
 * `<label>` 壳与 `data-scui-checked` 契约，服务端必须**同时**稳定输出，
 * 分开验会让「某个组件忘了输出两态」被别处的同名标记兜住。
 *
 * `counts` 判据因此放在 `ssr-smoke.mjs` 的 T2-05 入口上，逐个数清每个来源。
 * 半选的 `indeterminate` 是 DOM property（客户端 effect 写），服务端只输出
 * `aria-checked="mixed"` 与 `data-scui-checked="mixed"`，不序列化该属性。
 */
import { renderToString } from 'solid-js/web';

import { Checkbox } from '../../checkbox/Checkbox';
import { CheckboxGroup } from '../../checkbox/CheckboxGroup';
import { FieldProvider } from '../../../form/field-context';
import { RadioGroup } from '../../radio/RadioGroup';
import { Switch } from '../../switch/Switch';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div>
      <Checkbox defaultChecked>已选中</Checkbox>
      <Checkbox>未选中</Checkbox>
      <Checkbox indeterminate>半选</Checkbox>
      <Checkbox disabled>禁用</Checkbox>

      <CheckboxGroup
        orientation="vertical"
        defaultValue={['a']}
        options={[
          { label: '甲', value: 'a' },
          { label: '乙', value: 'b' },
        ]}
        aria-label="城市"
      />

      <RadioGroup
        defaultValue="b"
        options={[
          { label: '甲', value: 'a' },
          { label: '乙', value: 'b' },
        ]}
        aria-label="方案"
      />

      <Switch defaultChecked>已开启</Switch>
      <Switch>已关闭</Switch>

      <FieldProvider name="agree" value={() => true} setValue={() => undefined}>
        <Checkbox>字段内</Checkbox>
      </FieldProvider>
    </div>
  ));
}
