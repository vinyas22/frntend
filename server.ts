/***************************************************************************************************
 * Load Zone.js for the server.
 */
import 'zone.js/node';

import express from 'express';
import { join } from 'path';
import { APP_BASE_HREF } from '@angular/common';
import { existsSync } from 'fs';
import { ngExpressEngine } from '@nguniversal/express-engine';
import bootstrap from './src/main.server';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// The Express app is exported so that it can be used by serverless Functions (Vercel, etc.)
export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/frntend/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? 'index.original.html'
    : 'index.html';

  // Angular Universal engine
  server.engine('html', ngExpressEngine({ bootstrap }));
  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Example API route
  server.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from server!' });
  });

  // Static files
  server.get('*.*', express.static(distFolder, { maxAge: '1y' }));

  // All other routes
  server.get('*', (req, res) => {
    res.render(indexHtml, {
      req,
      providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }]
    });
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// ✅ ESM-safe main check
const isMainModule = process.argv[1] === __filename;
if (isMainModule) {
  run();
}

export * from './src/main.server';
