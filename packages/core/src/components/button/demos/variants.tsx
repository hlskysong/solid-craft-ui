import { For } from 'solid-js';
import { Button } from 'solid-craft';
import { COLORS, VARIANTS } from '../../demos/shared';

export const demo = {
  title: '变体与语义色',
  description: '五种视觉变体与五种语义色可自由组合；默认变体为 solid、默认色为 primary。',
};

export default function Variants() {
  return (
    <div class="demo-stack">
      <div class="demo-row">
        <For each={VARIANTS}>{(variant) => <Button variant={variant}>{variant}</Button>}</For>
      </div>
      <div class="demo-row">
        <For each={COLORS}>
          {(color) => (
            <Button variant="outline" color={color}>
              {color}
            </Button>
          )}
        </For>
      </div>
    </div>
  );
}
