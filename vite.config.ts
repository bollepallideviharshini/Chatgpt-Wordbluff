import { defineConfig } from 'vite';
import handler from './netlify/functions/game.ts';

export default defineConfig({
  server: {
    port: 5173,
    host: true
  },
  plugins: [
    {
      name: 'netlify-functions-dev-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/.netlify/functions/game')) {
            let bodyBuffer = '';
            req.on('data', (chunk) => {
              bodyBuffer += chunk;
            });
            req.on('end', async () => {
              try {
                const url = new URL(req.url!, `http://${req.headers.host || 'localhost:5173'}`);
                const requestInit: RequestInit = {
                  method: req.method,
                  headers: req.headers as Record<string, string>
                };
                if (req.method !== 'GET' && req.method !== 'HEAD' && bodyBuffer) {
                  requestInit.body = bodyBuffer;
                }
                const request = new Request(url.toString(), requestInit);
                const response = await handler(request);

                res.statusCode = response.status;
                response.headers.forEach((val, key) => {
                  res.setHeader(key, val);
                });
                const resText = await response.text();
                res.end(resText);
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Internal dev server error' }));
              }
            });
            return;
          }
          next();
        });
      }
    }
  ]
});
