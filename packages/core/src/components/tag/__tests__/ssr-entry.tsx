/**
 * T3-10 SSR 入口之二：`Tag`。
 *
 * 只断言正面的静态骨架：五档 `data-scui-color` 逐一计数、四档 `data-scui-variant`
 * 逐一计数、`data-scui-bordered` 存在即真的两处、两个带 aria-label 的关闭按钮，
 * 以及页面容器与触发按钮。关闭回调在服务端不会执行，因此不写「点击后必须缺席」这类恒真假判据。
 */
import { renderToString } from 'solid-js/web';

import { Tag } from '../Tag';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN" data-scui-role="tag-page">
      <button type="button" data-scui-role="tag-trigger">
        打开标签
      </button>

      <Tag>草稿</Tag>
      <Tag color="primary">进行中</Tag>
      <Tag color="success" variant="light" bordered>
        已通过
      </Tag>
      <Tag color="warning" variant="outline" closable>
        待复核
      </Tag>
      <Tag color="danger" variant="light-outline" bordered closable closeLabel="移除驳回标签">
        已驳回
      </Tag>
    </div>
  ));
}
