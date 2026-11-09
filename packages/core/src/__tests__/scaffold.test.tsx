import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { CSS_PREFIX, UI_SCOPE, classNames } from '../index';

function Hello() {
  return <p data-scope={UI_SCOPE}>scaffold-ok</p>;
}

describe('workspace scaffold', () => {
  it('renders a Solid component under jsdom', () => {
    render(() => <Hello />);
    const node = screen.getByText('scaffold-ok');
    expect(node).toBeInTheDocument();
    expect(node.getAttribute('data-scope')).toBe(UI_SCOPE);
    expect(UI_SCOPE).toBe('solid-craft');
  });

  it('exposes the single-source scope constants and classNames', () => {
    expect(CSS_PREFIX).toBe('scui-');
    expect(classNames('a', false, undefined, 'b')).toBe('a b');
  });
});
