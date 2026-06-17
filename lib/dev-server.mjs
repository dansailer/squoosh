/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import http from 'http';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBasePath, stripBasePath, toAbsoluteUrl } from './base-path.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../.tmp/build/static');
const port = Number(process.env.DEV_PORT) || 5000;
const basePath = getBasePath();

const defaultHeaders = {
  'Cache-Control': 'no-cache',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

const redirects = new Map([
  [toAbsoluteUrl('/editor'), toAbsoluteUrl('/')],
]);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function resolvePath(urlPath) {
  const appPath = stripBasePath(urlPath);
  const decoded = decodeURIComponent(appPath.split('?')[0]);
  const filePath = path.resolve(root, `.${decoded}`);
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = new URL(req.url, 'http://localhost').pathname;

    if (redirects.has(urlPath)) {
      res.writeHead(302, { ...defaultHeaders, Location: redirects.get(urlPath) });
      res.end();
      return;
    }

    let filePath = resolvePath(urlPath);
    if (!filePath) {
      res.writeHead(403, defaultHeaders);
      res.end('Forbidden');
      return;
    }

    try {
      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
    } catch {
      // Fall through to readFile error handling.
    }

    try {
      const data = await readFile(filePath);
      res.writeHead(200, {
        ...defaultHeaders,
        'Content-Type': getMime(filePath),
      });
      res.end(data);
      return;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ENOENT' &&
        !appPathHasExtension(urlPath)
      ) {
        const indexHtml = await readFile(path.join(root, 'index.html'));
        res.writeHead(200, {
          ...defaultHeaders,
          'Content-Type': 'text/html; charset=utf-8',
        });
        res.end(indexHtml);
        return;
      }
      throw error;
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      res.writeHead(404, defaultHeaders);
      res.end('Not found');
      return;
    }
    res.writeHead(500, defaultHeaders);
    res.end('Internal error');
  }
});

function appPathHasExtension(urlPath) {
  const appPath = stripBasePath(urlPath);
  return Boolean(path.extname(appPath.split('?')[0]));
}

const baseSuffix = basePath ? basePath : '';
server.listen(port, () => {
  console.log(`Serving ${root} on http://localhost:${port}${baseSuffix}`);
});