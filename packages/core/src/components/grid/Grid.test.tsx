import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { Col, Row } from './Grid';

afterEach(cleanup);

describe('Grid', () => {
  it('uses medium gutter and wrapping by default on Row', () => {
    render(() => (
      <Row>
        <span>行内容</span>
      </Row>
    ));

    const row = screen.getByText('行内容').parentElement;
    expect(row).not.toBeNull();
    expect(row).toHaveClass('scui-row');
    expect(row).toHaveAttribute('data-scui-gutter', 'medium');
    expect(row).toHaveAttribute('data-scui-wrap', 'true');
  });

  it('renders span and offset through data attributes and custom properties', () => {
    render(() => (
      <Row>
        <Col span={12} offset={6}>
          <span>栅格内容</span>
        </Col>
      </Row>
    ));

    const col = screen.getByText('栅格内容').parentElement;
    expect(col).not.toBeNull();
    expect(col).toHaveClass('scui-col');
    expect(col).toHaveAttribute('data-scui-span', '12');
    expect(col).toHaveAttribute('data-scui-offset', '6');

    const style = col?.getAttribute('style') ?? '';
    expect(style).toMatch(/--scui-col-span:\s*12/);
    expect(style).toMatch(/--scui-col-offset:\s*6/);
  });

  it('renders order through the order custom property', () => {
    render(() => (
      <Row>
        <Col order={2}>
          <span>排序内容</span>
        </Col>
      </Row>
    ));

    const col = screen.getByText('排序内容').parentElement;
    expect(col).not.toBeNull();

    const style = col?.getAttribute('style') ?? '';
    expect(style).toMatch(/--scui-col-order:\s*2/);
  });

  it('renders responsive span custom properties for every breakpoint', () => {
    render(() => (
      <Row>
        <Col xs={24} sm={12} md={8} lg={6} xl={4} xxl={3}>
          <span>响应式内容</span>
        </Col>
      </Row>
    ));

    const col = screen.getByText('响应式内容').parentElement;
    expect(col).not.toBeNull();

    const style = col?.getAttribute('style') ?? '';
    expect(style).toMatch(/--scui-col-span-xs:\s*24/);
    expect(style).toMatch(/--scui-col-span-sm:\s*12/);
    expect(style).toMatch(/--scui-col-span-md:\s*8/);
    expect(style).toMatch(/--scui-col-span-lg:\s*6/);
    expect(style).toMatch(/--scui-col-span-xl:\s*4/);
    expect(style).toMatch(/--scui-col-span-xxl:\s*3/);
  });

  it('clamps span values into the 1–24 range', () => {
    render(() => (
      <Row>
        <Col span={30}>
          <span>超上界</span>
        </Col>
        <Col span={0}>
          <span>超下界</span>
        </Col>
      </Row>
    ));

    const upper = screen.getByText('超上界').parentElement;
    const lower = screen.getByText('超下界').parentElement;

    expect(upper).toHaveAttribute('data-scui-span', '24');
    expect(upper?.getAttribute('style')).toMatch(/--scui-col-span:\s*24/);
    expect(lower).toHaveAttribute('data-scui-span', '1');
    expect(lower?.getAttribute('style')).toMatch(/--scui-col-span:\s*1/);
  });
});
