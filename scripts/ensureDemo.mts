import { existsSync } from 'fs';
import path from 'path';

const demoIndex = path.resolve(import.meta.dirname, '..', 'demo', 'index.html');

if (!existsSync(demoIndex)) {
  await import('./buildDemo.mts');
}
