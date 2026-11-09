import { Col, Row } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '24 栅格、偏移与对齐换行。',
};

export default function Basic() {
  return (
    <>
      <DemoSection title="24 栅格">
        <Row gutter="medium" class="demo-grid-row">
          <Col span={6}>span 6</Col>
          <Col span={6}>span 6</Col>
          <Col span={6}>span 6</Col>
          <Col span={6}>span 6</Col>
        </Row>
        <Row gutter="large" class="demo-grid-row">
          <Col span={8} offset={2}>
            span 8 / offset 2
          </Col>
          <Col span={12}>span 12</Col>
        </Row>
      </DemoSection>
      <DemoSection title="对齐与换行">
        <Row align="middle" justify="space-between" class="demo-grid-row">
          <Col span={5}>left</Col>
          <Col span={5}>right</Col>
        </Row>
      </DemoSection>
    </>
  );
}
