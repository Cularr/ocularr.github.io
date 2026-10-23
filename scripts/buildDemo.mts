import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import { URL_BASE } from '../frontend/src/DemoApi/constants.ts';
import extractProviders from './extractProviders.mts';
import fetchShows from './fetchShows.mts';
import finalizeDemo from './finalizeDemo.mts';

const root = path.resolve(import.meta.dirname, '..');
const sonarrRef =
  process.env.SONARR_REF ?? 'b3d4bb8c18f7feb6744a6cd3231279a45351bb5e';
const sonarrDir =
  process.env.SONARR_SOURCE ?? path.join(root, '.cache', 'sonarr');
const finalDir = path.join(root, 'demo');
const demoDir = path.join(root, '.demo-build');
const isWindows = process.platform === 'win32';

const UNUSED_FILES = [
  'Content/Images/poster-dark.png',
  'Content/Images/Icons/favicon-debug.ico',
  'Content/Images/Icons/favicon-debug-16x16.png',
  'Content/Images/Icons/favicon-debug-32x32.png',
  'Content/Images/Icons/mstile-70x70.png',
  'Content/Images/Icons/mstile-144x144.png',
  'Content/Images/Icons/mstile-310x150.png',
  'Content/Images/Icons/mstile-310x310.png',
];

function quote(value: string) {
  return isWindows && /\s/.test(value) ? `"${value}"` : value;
}

function run(command: string, args: string[], cwd: string) {
  execFileSync(quote(command), args.map(quote), {
    cwd,
    stdio: 'inherit',
    shell: isWindows,
  });
}

function output(command: string, args: string[], cwd: string) {
  return execFileSync(quote(command), args.map(quote), {
    cwd,
    shell: isWindows,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .toString()
    .trim();
}

function currentCommit() {
  try {
    return output('git', ['rev-parse', 'HEAD'], sonarrDir);
  } catch {
    return '';
  }
}

if (!process.env.SONARR_SOURCE) {
  if (!existsSync(path.join(sonarrDir, '.git'))) {
    mkdirSync(sonarrDir, { recursive: true });
    run('git', ['init', '--quiet'], sonarrDir);
    run(
      'git',
      ['remote', 'add', 'origin', 'https://github.com/Sonarr/Sonarr.git'],
      sonarrDir
    );
  }

  if (!currentCommit().startsWith(sonarrRef)) {
    run('git', ['fetch', '--depth', '1', 'origin', sonarrRef], sonarrDir);
    run('git', ['checkout', '--quiet', '--force', 'FETCH_HEAD'], sonarrDir);
  }
}

const sonarrCommit = currentCommit();

if (!process.env.SONARR_SOURCE && !sonarrCommit.startsWith(sonarrRef)) {
  throw new Error(`Expected Sonarr ${sonarrRef} but found ${sonarrCommit}`);
}

console.log(`Building the demo from Sonarr ${sonarrCommit}`);

run(
  'yarn',
  ['install', '--frozen-lockfile', '--ignore-engines', '--ignore-scripts'],
  sonarrDir
);
run(path.join(sonarrDir, 'node_modules', '.bin', 'vite'), ['build'], sonarrDir);

const sonarrOutput = path.join(sonarrDir, '_output', 'UI');

rmSync(demoDir, { recursive: true, force: true });
cpSync(sonarrOutput, demoDir, {
  recursive: true,
  filter: (source) =>
    !source.endsWith('.map') &&
    !['login.html', 'logout.html', 'oauth.html'].includes(
      path.basename(source)
    ) &&
    !UNUSED_FILES.includes(
      path.relative(sonarrOutput, source).split(path.sep).join('/')
    ),
});

const localizationSource = path.join(
  sonarrDir,
  'src/NzbDrone.Core/Localization/Core'
);
const localizationDir = path.join(demoDir, 'localization');

mkdirSync(localizationDir, { recursive: true });

readdirSync(localizationSource)
  .filter((file) => file.endsWith('.json'))
  .forEach((file) => {
    cpSync(
      path.join(localizationSource, file),
      path.join(localizationDir, file.toLowerCase())
    );
  });

const themeScript = `(function () {
        try {
          var stored = window.parent.localStorage.getItem('theme');

          return stored === 'light' || stored === 'dark' ? stored : 'auto';
        } catch (e) {
          return 'auto';
        }
      })()`;

const indexPath = path.join(demoDir, 'index.html');
const index = readFileSync(indexPath, 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/__URL_BASE__/g, URL_BASE)
  .replace("'_THEME_'", themeScript)
  .replace(/^[ \t]*__MINI_PROFILER__[ \t]*\n/m, '')
  .replace(/(href|src|content)="\/(?!\/)/g, `$1="${URL_BASE}/`)
  .replace(
    '<script type="module"',
    `<script src="${URL_BASE}/demo-api.js"></script>\n    <script type="module"`
  )
  .replace(
    '<meta name="description" content="Sonarr" />',
    `<meta name="description" content="Sonarr demo with sample data" />\n    <meta name="robots" content="noindex" />\n    <meta name="sonarr-commit" content="${sonarrCommit}" />`
  );

const scriptHashes = Array.from(
  index.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)
).map(
  ([, content]) =>
    `'sha256-${createHash('sha256')
      .update(content.replace(/\r\n/g, '\n'))
      .digest('base64')}'`
);

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' ${scriptHashes.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

writeFileSync(
  indexPath,
  index.replace(
    '<meta charset="utf-8" />',
    `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}" />`
  )
);

const redirectPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=${URL_BASE}/" />
    <title>Sonarr</title>
  </head>
  <body>
    <a href="${URL_BASE}/">Back to the Sonarr demo</a>
  </body>
</html>
`;

['logout', 'login'].forEach((name) => {
  mkdirSync(path.join(demoDir, name), { recursive: true });
  writeFileSync(path.join(demoDir, name, 'index.html'), redirectPage);
});

extractProviders(sonarrDir, path.join(demoDir, 'providers.json'));

await fetchShows(demoDir, { artworkFrom: finalDir });

run(
  path.join(root, 'node_modules', '.bin', 'vite'),
  ['build', '--config', 'vite.demo.config.ts', '--outDir', demoDir],
  root
);

finalizeDemo(demoDir);

rmSync(finalDir, { recursive: true, force: true });
renameSync(demoDir, finalDir);
