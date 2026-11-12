import { Col, Row } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '响应式断点',
  description: 'xs / sm / md / lg 四个断点在 1280 与 768 两个基线视口下的列数变化。',
};

export default function Responsive() {
  return (
    <>
      <DemoSection title="断点列数">
        <Row gutter="small" class="demo-grid-row">
          <Col xs={24} sm={12} md={8} lg={6}>
            xs 24 / sm 12 / md 8 / lg 6
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            xs 24 / sm 12 / md 8 / lg 6
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            xs 24 / sm 12 / md 8 / lg 6
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            xs 24 / sm 12 / md 8 / lg 6
          </Col>
        </Row>
      </DemoSection>
      <DemoSection title="窄屏整行">
        <Row gutter="small" class="demo-grid-row">
          <Col xs={24} md={12}>
            xs 24 / md 12
          </Col>
          <Col xs={24} md={12}>
            xs 24 / md 12
          </Col>
        </Row>
      </DemoSection>
    </>
  );
}
