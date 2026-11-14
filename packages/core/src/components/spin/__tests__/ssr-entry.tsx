/**
 * T3-05 SSR 入口之一：`Spin`。
 *
 * 覆盖：① 独立转圈（三档尺寸一次给全）；② 带 tip；③ 包裹模式 spinning=true；
 * ④ 包裹模式 spinning=false（服务端不出遮罩、不出 aria-busy）；
 * ⑤ **delay=400 且 spinning=true**：服务端首帧必须**没有**遮罩 ——
 *    effect 在 SSR 不执行，首帧由「delay === 0」的同步初值决定，客户端首帧一致。
 *
 * 首帧关键点：`role="status"`、`aria-busy="true"`、`data-scui-spinning` 都是 attribute；
 * 无 tip 时才出现视觉隐藏的「加载中」。
 *
 * 不进 `dist`、不进 npm 包：`collect-sources` 与 `tsconfig.build.json` 排除 `__tests__`。
 */
import { renderToString } from 'solid-js/web';

import { Spin } from '../Spin';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <Spin size="small" />
      <Spin size="large" />

      <Spin tip="正在加载设备清单" />

      <Spin>
        <div>服务端直出的内容</div>
      </Spin>

      <Spin spinning={false}>
        <div>不加载的内容</div>
      </Spin>

      <Spin delay={400}>
        <div>延迟加载的内容</div>
      </Spin>
    </div>
  ));
}
