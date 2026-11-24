import react from '@vitejs/plugin-react';
import { createHash } from 'crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { patchCssModules } from 'vite-css-modules';

const src = path.resolve(import.meta.dirname, 'frontend/src');

const demoDir = path.resolve(import.meta.dirname, 'demo');

const contentTypes: Record<string, string> = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

const staticFolders = ['docs', 'img', 'logo'];

function serveDemo(): Plugin {
  return {
    name: 'serve-demo',

    configureServer(server) {
      server.middlewares.use('/demo', (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        let requested = '';

        try {
          requested = path.join(demoDir, decodeURIComponent(url.pathname));
        } catch {
          requested = '';
        }

        if (
          requested.includes('\0') ||
          (!requested.startsWith(demoDir + path.sep) && requested !== demoDir)
        ) {
          res.statusCode = 404;
          res.end();

          return;
        }

        let file = requested;

        if (!existsSync(file) || !statSync(file).isFile()) {
          const accept = req.headers.accept;
          const relative = path.relative(demoDir, file);
          const [folder] = relative.split(path.sep);

          if (
            ['assets', 'content', 'mediacover', 'sourceicons'].includes(
              folder.toLowerCase()
            ) ||
            relative.includes('.') ||
            (accept && !accept.includes('text/html'))
          ) {
            res.statusCode = 404;
            res.end();

            return;
          }

          file = path.join(demoDir, 'index.html');

          if (!existsSync(file) || !statSync(file).isFile()) {
            res.statusCode = 404;
            res.end();

            return;
          }
        }

        res.setHeader(
          'Content-Type',
          contentTypes[path.extname(file)] ?? 'application/octet-stream'
        );
        res.end(readFileSync(file));
      });
    },
  };
}

function serveStatic(): Plugin {
  const root = import.meta.dirname;

  return {
    name: 'serve-static',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const [, folder] = url.pathname.split('/');

        if (!staticFolders.includes(folder)) {
          next();

          return;
        }

        let requested = '';

        try {
          requested = path.join(root, decodeURIComponent(url.pathname));
        } catch {
          requested = '';
        }

        const folderRoot = path.join(root, folder);

        if (
          requested !== folderRoot &&
          !requested.startsWith(folderRoot + path.sep)
        ) {
          next();

          return;
        }

        if (existsSync(requested) && statSync(requested).isDirectory()) {
          if (!url.pathname.endsWith('/')) {
            res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
            res.end();

            return;
          }

          requested = path.join(requested, 'index.html');
        }

        if (!existsSync(requested) || !statSync(requested).isFile()) {
          next();

          return;
        }

        res.setHeader(
          'Content-Type',
          contentTypes[path.extname(requested)] ?? 'application/octet-stream'
        );
        res.end(readFileSync(requested));
      });
    },
  };
}

function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',

    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const hashes = Array.from(
          html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)
        ).map(
          ([, content]) =>
            `'sha256-${createHash('sha256')
              .update(content.replace(/\r\n/g, '\n'))
              .digest('base64')}'`
        );
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(' ')}`,
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self'",
          "connect-src 'self'",
          "frame-src 'self'",
          "worker-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'none'",
        ].join('; ');

        return html.replace(
          '<meta charset="utf-8" />',
          `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`
        );
      },
    },
  };
}

const srcAliases = Object.fromEntries(
  readdirSync(src, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [entry.name, path.join(src, entry.name)])
);

export default defineConfig({
  root: src,
  publicDir: false,
  plugins: [
    patchCssModules({ exportMode: 'default' }),
    react(),
    serveDemo(),
    serveStatic(),
    contentSecurityPolicy(),
  ],

  base: '/',

  server: {
    port: 8960,
    fs: {
      allow: [import.meta.dirname],
    },
  },

  build: {
    outDir: import.meta.dirname,
    emptyOutDir: false,
    assetsDir: 'assets',
    target: 'es2020',
  },

  resolve: {
    alias: srcAliases,
  },

  css: {
    postcss: path.resolve(import.meta.dirname, 'frontend'),
  },
});
