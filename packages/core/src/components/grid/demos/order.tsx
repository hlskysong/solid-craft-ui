import { Col, Row } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '排序与分布',
  description: 'order 改变视觉顺序而不动 DOM 顺序，justify 控制主轴分布。',
};

export default function Order() {
  return (
    <>
      <DemoSection title="order 排序">
        <Row gutter="small" class="demo-grid-row">
          <Col span={6} order={3}>
            DOM 第一 · order 3
          </Col>
          <Col span={6} order={1}>
            DOM 第二 · order 1
          </Col>
          <Col span={6} order={2}>
            DOM 第三 · order 2
          </Col>
        </Row>
      </DemoSection>
      <DemoSection title="主轴分布">
        <Row justify="space-around" class="demo-grid-row">
          <Col span={4}>space-around 1</Col>
          <Col span={4}>space-around 2</Col>
          <Col span={4}>space-around 3</Col>
        </Row>
        <Row justify="center" class="demo-grid-row">
          <Col span={6}>center 1</Col>
          <Col span={6}>center 2</Col>
        </Row>
      </DemoSection>
    </>
  );
}
