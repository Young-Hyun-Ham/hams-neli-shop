// vite.config.ts
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs/promises';
import nodePath from 'node:path';
import { componentTagger } from 'lovable-tagger';
import path from "path";
import type { IncomingMessage, ServerResponse } from 'node:http';

import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';
import {
  clearServiceSession,
  createSSOStateCookie,
  createServiceSessionCookie,
  getClearedSSOStateCookieHeader,
  getSSOStateFromRequest,
  getServiceViewerFromRequest,
} from './server/sso-session';


// CJS/ESM interop for Babel libs
const traverse: typeof _traverse.default = ( (_traverse as any).default ?? _traverse ) as any;
const generate: typeof _generate.default = ( (_generate as any).default ?? _generate ) as any;

function writeJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function redirect(res: ServerResponse, location: string, setCookie?: string | string[]) {
  res.statusCode = 302;

  if (setCookie) {
    res.setHeader('Set-Cookie', setCookie);
  }

  res.setHeader('Location', location);
  res.end();
}

function createState() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getServiceSSOConfig() {
  const authOrigin = process.env.VITE_SSO_AUTH_ORIGIN || 'http://localhost:3000';
  const clientId = process.env.VITE_SSO_CLIENT_ID || 'service-3002';
  const serviceOrigin = process.env.VITE_SERVICE_ORIGIN || 'http://localhost:3002';
  const callbackPath = process.env.VITE_SSO_CALLBACK_PATH || '/auth/sso/callback';
  const exchangePath = process.env.VITE_SSO_EXCHANGE_PATH || '/api/sso/exchange';
  const clientSecret = process.env.SERVICE_SSO_CLIENT_SECRET || 'dev-service-3002-secret';

  return {
    authOrigin,
    clientId,
    serviceOrigin,
    callbackPath,
    exchangeUrl: new URL(exchangePath, authOrigin).toString(),
    clientSecret,
    redirectUri: new URL(callbackPath, serviceOrigin).toString(),
    loginStartPath: process.env.VITE_SSO_LOGIN_START_PATH || '/auth/sso/login',
  };
}

function createServiceAuthApiPlugin(): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ? new URL(req.url, 'http://localhost') : null;

    if (!url) {
      next();
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/me') {
      const user = getServiceViewerFromRequest(req);

      if (!user) {
        writeJson(res, 401, { user: null });
        return;
      }

      writeJson(res, 200, { user });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/logout') {
      clearServiceSession(res);
      writeJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url.pathname === getServiceSSOConfig().loginStartPath) {
      const { authOrigin, clientId, redirectUri } = getServiceSSOConfig();
      const state = createState();
      const authUrl = new URL('/sso/start', authOrigin);

      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', state);

      redirect(res, authUrl.toString(), createSSOStateCookie(state));
      return;
    }

    if (req.method === 'GET' && url.pathname === getServiceSSOConfig().callbackPath) {
      const { exchangeUrl, clientId, clientSecret, redirectUri, serviceOrigin } =
        getServiceSSOConfig();
      const code = url.searchParams.get('code')?.trim() ?? '';
      const state = url.searchParams.get('state')?.trim() ?? '';
      const storedState = getSSOStateFromRequest(req);

      if (!code || !state || !storedState || storedState !== state) {
        redirect(
          res,
          new URL('/?sso=invalid_state', serviceOrigin).toString(),
          getClearedSSOStateCookieHeader(),
        );
        return;
      }

      try {
        const exchangeResponse = await fetch(exchangeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
          }),
        });

        if (!exchangeResponse.ok) {
          redirect(
            res,
            new URL('/?sso=exchange_failed', serviceOrigin).toString(),
            getClearedSSOStateCookieHeader(),
          );
          return;
        }

        const payload = (await exchangeResponse.json()) as {
          ok?: boolean;
          user?: {
            id: string;
            loginId: string;
            email: string;
            nickname: string;
            provider: string;
          };
        };

        if (!payload.ok || !payload.user) {
          redirect(
            res,
            new URL('/?sso=exchange_failed', serviceOrigin).toString(),
            getClearedSSOStateCookieHeader(),
          );
          return;
        }

        redirect(
          res,
          new URL('/', serviceOrigin).toString(),
          [getClearedSSOStateCookieHeader(), ...createServiceSessionCookie(payload.user)],
        );
        return;
      } catch (error) {
        console.error('Failed to exchange SSO code:', error);
        redirect(
          res,
          new URL('/?sso=exchange_failed', serviceOrigin).toString(),
          getClearedSSOStateCookieHeader(),
        );
        return;
      }
    }

    next();
  };

  return {
    name: 'service-auth-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

function cdnPrefixImages(): Plugin {
  const DEBUG = process.env.CDN_IMG_DEBUG === '1';
  let publicDir = '';              // absolute path to Vite public dir
  const imageSet = new Set<string>(); // stores normalized '/images/...' paths

  const isAbsolute = (p: string) =>
    /^(?:[a-z]+:)?\/\//i.test(p) || p.startsWith('data:') || p.startsWith('blob:');

  // normalize a ref like './images/x.png', '../images/x.png', '/images/x.png' -> '/images/x.png'
  const normalizeRef = (p: string) => {
    let s = p.trim();
    // quick bail-outs
    if (isAbsolute(s)) return s;
    // strip leading ./ and any ../ segments (we treat public/ as root at runtime)
    s = s.replace(/^(\.\/)+/, '');
    while (s.startsWith('../')) s = s.slice(3);
    if (s.startsWith('/')) s = s.slice(1);
    // ensure it starts with images/
    if (!s.startsWith('images/')) return p; // not under images → leave as is
    return '/' + s; // canonical: '/images/...'
  };

  const toCDN = (p: string, cdn: string) => {
    const n = normalizeRef(p);
    if (isAbsolute(n)) return n;
    if (!n.startsWith('/images/')) return p;           // not our folder
    if (!imageSet.has(n)) return p;                    // not an existing file
    const base = cdn.endsWith('/') ? cdn : cdn + '/';
    return base + n.slice(1);                          // 'https://cdn/.../images/..'
  };

  const rewriteSrcsetList = (value: string, cdn: string) =>
    value
      .split(',')
      .map((part) => {
        const [url, desc] = part.trim().split(/\s+/, 2);
        const out = toCDN(url, cdn);
        return desc ? `${out} ${desc}` : out;
      })
      .join(', ');

  const rewriteHtml = (html: string, cdn: string) => {
    // src / href
    html = html.replace(
      /(src|href)\s*=\s*(['"])([^'"]+)\2/g,
      (_m, k, q, p) => `${k}=${q}${toCDN(p, cdn)}${q}`
    );
    // srcset
    html = html.replace(
      /(srcset)\s*=\s*(['"])([^'"]+)\2/g,
      (_m, k, q, list) => `${k}=${q}${rewriteSrcsetList(list, cdn)}${q}`
    );
    return html;
  };

  const rewriteCssUrls = (code: string, cdn: string) =>
    code.replace(/url\((['"]?)([^'")]+)\1\)/g, (_m, q, p) => `url(${q}${toCDN(p, cdn)}${q})`);

  const rewriteJsxAst = (code: string, id: string, cdn: string) => {
    const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    let rewrites = 0;

    traverse(ast, {
      JSXAttribute(path: any) {
        const name = (path.node.name as t.JSXIdentifier).name;
        const isSrc = name === 'src' || name === 'href';
        const isSrcSet = name === 'srcSet' || name === 'srcset';
        if (!isSrc && !isSrcSet) return;

        const val = path.node.value;
        if (!val) return;

        if (t.isStringLiteral(val)) {
          const before = val.value;
          val.value = isSrc ? toCDN(val.value, cdn) : rewriteSrcsetList(val.value, cdn);
          if (val.value !== before) rewrites++;
          return;
        }
        if (t.isJSXExpressionContainer(val) && t.isStringLiteral(val.expression)) {
          const before = val.expression.value;
          val.expression.value = isSrc
            ? toCDN(val.expression.value, cdn)
            : rewriteSrcsetList(val.expression.value, cdn);
          if (val.expression.value !== before) rewrites++;
        }
      },

      StringLiteral(path: any) {
        // skip object keys: { "image": "..." }
        if (t.isObjectProperty(path.parent) && path.parentKey === 'key' && !path.parent.computed) return;
        // skip import/export sources
        if (t.isImportDeclaration(path.parent) || t.isExportAllDeclaration(path.parent) || t.isExportNamedDeclaration(path.parent)) return;
        // skip inside JSX attribute (already handled)
        if (path.findParent((p: any) => p.isJSXAttribute())) return;

        const before = path.node.value;
        const after = toCDN(before, cdn);
        if (after !== before) { path.node.value = after; rewrites++; }
      },

      TemplateLiteral(path: any) {
        // handle `"/images/foo.png"` as template with NO expressions
        if (path.node.expressions.length) return;
        const raw = path.node.quasis.map((q: any) => q.value.cooked ?? q.value.raw).join('');
        const after = toCDN(raw, cdn);
        if (after !== raw) {
          path.replaceWith(t.stringLiteral(after));
          rewrites++;
        }
      },

    });

    if (!rewrites) return null;
    const out = generate(ast, { retainLines: true, sourceMaps: false }, code).code;
    if (DEBUG) console.log(`[cdn] ${id} → ${rewrites} rewrites`);
    return out;
  };

  async function collectPublicImagesFrom(dir: string) {
    // Recursively collect every file under public/images into imageSet as '/images/relpath'
    const imagesDir = nodePath.join(dir, 'images');
    const stack = [imagesDir];
    while (stack.length) {
      const cur = stack.pop()!;
      let entries: any[] = [];
      try {
        entries = await fs.readdir(cur, { withFileTypes: true });
      } catch {
        continue; // images/ may not exist
      }
      for (const ent of entries) {
        const full = nodePath.join(cur, ent.name);
        if (ent.isDirectory()) {
          stack.push(full);
        } else if (ent.isFile()) {
          const rel = nodePath.relative(dir, full).split(nodePath.sep).join('/');
          const canonical = '/' + rel; // '/images/...'
          imageSet.add(canonical);
          // also add variant without leading slash for safety
          imageSet.add(canonical.slice(1)); // 'images/...'
        }
      }
    }
  }

  return {
    name: 'cdn-prefix-images-existing',
    apply: 'build',
    enforce: 'pre', // run before @vitejs/plugin-react

    configResolved(cfg) {
      publicDir = cfg.publicDir; // absolute
      if (DEBUG) console.log('[cdn] publicDir =', publicDir);
    },

    async buildStart() {
      await collectPublicImagesFrom(publicDir);
      if (DEBUG) console.log('[cdn] images found:', imageSet.size);
    },

    transformIndexHtml(html) {
      const cdn = process.env.CDN_IMG_PREFIX;
      if (!cdn) return html;
      const out = rewriteHtml(html, cdn);
      if (DEBUG) console.log('[cdn] transformIndexHtml done');
      return out;
    },

    transform(code, id) {
      const cdn = process.env.CDN_IMG_PREFIX;
      if (!cdn) return null;

      if (/\.(jsx|tsx)$/.test(id)) {
        const out = rewriteJsxAst(code, id, cdn);
        return out ? { code: out, map: null } : null;
      }

      if (/\.(css|scss|sass|less|styl)$/i.test(id)) {
        const out = rewriteCssUrls(code, cdn);
        return out === code ? null : { code: out, map: null };
      }

      return null;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const servicePort = Number(process.env.VITE_SERVICE_PORT || '3002');

  return {
    server: {
      host: "::",
      port: servicePort,
    },
    preview: {
      host: "::",
      port: servicePort,
    },
    plugins: [
      tailwindcss(),
      react(),
      mode === 'development' &&
      componentTagger(),
      createServiceAuthApiPlugin(),
      cdnPrefixImages(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // Proxy react-router-dom to our wrapper
        "react-router-dom": path.resolve(__dirname, "./src/lib/react-router-dom-proxy.tsx"),
        // Original react-router-dom under a different name
        "react-router-dom-original": "react-router-dom",
      },
    },
    define: {
      // Define environment variables for build-time configuration
      // In production, this will be false by default unless explicitly set to 'true'
      // In development and test, this will be true by default
      __ROUTE_MESSAGING_ENABLED__: JSON.stringify(
        mode === 'production' 
          ? process.env.VITE_ENABLE_ROUTE_MESSAGING === 'true'
          : process.env.VITE_ENABLE_ROUTE_MESSAGING !== 'false'
      ),
    },
  }
});
