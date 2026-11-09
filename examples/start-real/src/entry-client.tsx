import { mount, StartClient } from '@solidjs/start/client';

const container = document.getElementById('app');
if (!container) {
  throw new Error('[example-start-real] missing #app container');
}

mount(() => <StartClient />, container);
