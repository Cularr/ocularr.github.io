import { existsSync, readFileSync } from 'fs';
import path from 'path';

const demoIndex = path.resolve(import.meta.dirname, '..', 'demo', 'index.html');

if (
  !existsSync(demoIndex) ||
  !readFileSync(demoIndex, 'utf8').includes('name="ocularr-commit"')
) {
  await import('./buildDemo.mts');
}
