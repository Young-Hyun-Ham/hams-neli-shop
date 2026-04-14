import http from 'node:http';

import { createServer as createViteServer, loadEnv } from 'vite';

const root = process.cwd();
const mode = process.env.NODE_ENV || 'development';
const env = loadEnv(mode, root, '');

Object.assign(process.env, env);

const port = Number(process.env.VITE_SERVICE_PORT || process.env.PORT || '3001');
const host = process.env.HOST || '0.0.0.0';

const httpServer = http.createServer(async (req, res) => {
  try {
    const { handleServiceApiRequest } = await vite.ssrLoadModule('/server/sso-handler.ts');
    const handled = await handleServiceApiRequest(req, res);

    if (handled) {
      return;
    }

    vite.middlewares(req, res, (error) => {
      if (!error) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      vite.ssrFixStacktrace(error);
      res.statusCode = 500;
      res.end(error.message);
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    vite.ssrFixStacktrace(err);
    res.statusCode = 500;
    res.end(err.message);
  }
});

const vite = await createViteServer({
  server: {
    middlewareMode: true,
    hmr: {
      server: httpServer,
    },
  },
  appType: 'spa',
});

httpServer.listen(port, host, () => {
  console.log(`Dev server running at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
});
