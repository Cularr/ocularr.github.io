import { cpSync, existsSync, rmSync } from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, '_site');

const ENTRIES = [
  '404.html',
  'CNAME',
  'assets',
  'css',
  'demo',
  'docs',
  'donate.html',
  'img',
  'index.html',
  'logo',
  'privacy.html',
];

rmSync(outDir, { recursive: true, force: true });

ENTRIES.forEach((entry) => {
  const source = path.join(root, entry);

  if (!existsSync(source)) {
    throw new Error(`${entry} is missing, run yarn build and yarn build:demo`);
  }

  cpSync(source, path.join(outDir, entry), { recursive: true });
});

console.log(`Site assembled in ${outDir}`);
