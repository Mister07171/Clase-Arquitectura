// @ts-nocheck
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

let sharedCinemaDb: any = null;

function multiDeviceSyncPlugin() {
  return {
    name: 'multidevice-sync-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/sync', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              sharedCinemaDb = JSON.parse(body);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Payload corrupto' }));
            }
          });
        } else {
          res.statusCode = 200;
          res.end(JSON.stringify(sharedCinemaDb || {}));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), multiDeviceSyncPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    allowedHosts: true,
  },
});