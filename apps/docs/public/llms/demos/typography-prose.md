# Typography 排版 · 文档排版（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/typography/demos/prose.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

标题、段落、行内修饰与链接组合成一段可读的说明文字。

## 完整源码

```tsx
import { Link, Paragraph, Text, Title } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '文档排版',
  description: '标题、段落、行内修饰与链接组合成一段可读的说明文字。',
};

export default function Prose() {
  return (
    <DemoSection title="一篇文章的排版">
      <article>
        <Title level={2}>维简设备采购计划</Title>
        <Paragraph>
          本计划用于汇总各矿上报的设备需求，按<Text bold>季度</Text>汇总后提交审批。 需求单位须在
          <Text mark>每季度首月 10 日前</Text>完成填报，逾期计入下一季度。
        </Paragraph>
        <Title level={3}>填报要求</Title>
        <Paragraph>
          设备名称与型号须与台账一致，计量单位取字典值
          <Text code>SCUI-UNIT</Text>
          ，单价按<Text underline>本次采购单价</Text>填写，不得使用累计口径。
        </Paragraph>
        <Paragraph>
          模板下载见
          <Link href="#typography-prose-anchor">采购计划模板</Link>
          ，历史数据可从<Text delete>旧版系统</Text>迁移。
        </Paragraph>
        <p id="typography-prose-anchor">锚点目标</p>
      </article>
    </DemoSection>
  );
}
```

## 相关页面

- [Typography 排版 API](../exports/typography.md)
- [设计 Token](../design/tokens.md)
