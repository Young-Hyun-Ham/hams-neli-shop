import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  clearServiceSession,
  createSSOStateCookie,
  createServiceSessionCookie,
  getClearedSSOStateCookieHeader,
  getSSOStateFromRequest,
  getServiceViewerFromRequest,
} from './sso-session';

type Next = () => void;

type ServiceViewer = {
  id: string;
  loginId: string;
  email: string;
  nickname: string;
  provider: string;
};

type ExchangeResponsePayload = {
  ok?: boolean;
  user?: ServiceViewer;
};

function getEnv(names: string[], fallback?: string) {
  for (const name of names) {
    const value = process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return fallback;
}

export function writeJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function redirect(res: ServerResponse, location: string, setCookie?: string | string[]) {
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

export function getServiceSSOConfig() {
  const authOrigin = getEnv(['SSO_AUTH_ORIGIN', 'VITE_SSO_AUTH_ORIGIN'], 'http://localhost:3000');
  const clientId = getEnv(['SSO_CLIENT_ID', 'VITE_SSO_CLIENT_ID'], 'service-3001');
  const serviceOrigin = getEnv(['SERVICE_ORIGIN', 'VITE_SERVICE_ORIGIN'], 'http://localhost:3001');
  const callbackPath = getEnv(['SSO_CALLBACK_PATH', 'VITE_SSO_CALLBACK_PATH'], '/auth/sso/callback');
  const exchangePath = getEnv(['SSO_EXCHANGE_PATH', 'VITE_SSO_EXCHANGE_PATH'], '/api/sso/exchange');
  const clientSecret = getEnv(
    ['SERVICE_SSO_CLIENT_SECRET', 'SSO_CLIENT_SECRET'],
    'dev-service-3001-secret',
  );
  const loginStartPath = getEnv(
    ['SSO_LOGIN_START_PATH', 'VITE_SSO_LOGIN_START_PATH'],
    '/auth/sso/login',
  );

  return {
    authOrigin,
    clientId,
    serviceOrigin,
    callbackPath,
    exchangeUrl: new URL(exchangePath, authOrigin).toString(),
    clientSecret,
    redirectUri: new URL(callbackPath, serviceOrigin).toString(),
    loginStartPath,
  };
}

function getRequestUrl(req: IncomingMessage) {
  if (!req.url) {
    return null;
  }

  const host = req.headers.host || 'localhost';
  const protocol =
    typeof req.headers['x-forwarded-proto'] === 'string'
      ? req.headers['x-forwarded-proto']
      : 'http';

  return new URL(req.url, `${protocol}://${host}`);
}

async function handleLoginStart(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    writeJson(res, 405, { error: 'method_not_allowed' });
    return true;
  }

  const { authOrigin, clientId, redirectUri } = getServiceSSOConfig();
  const state = createState();
  const authUrl = new URL('/sso/start', authOrigin);

  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);

  redirect(res, authUrl.toString(), createSSOStateCookie(state));
  return true;
}

async function handleCallback(req: IncomingMessage, res: ServerResponse, url: URL) {
  if (req.method !== 'GET') {
    writeJson(res, 405, { error: 'method_not_allowed' });
    return true;
  }

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
    return true;
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
      return true;
    }

    const payload = (await exchangeResponse.json()) as ExchangeResponsePayload;

    if (!payload.ok || !payload.user) {
      redirect(
        res,
        new URL('/?sso=exchange_failed', serviceOrigin).toString(),
        getClearedSSOStateCookieHeader(),
      );
      return true;
    }

    redirect(
      res,
      new URL('/', serviceOrigin).toString(),
      [getClearedSSOStateCookieHeader(), ...createServiceSessionCookie(payload.user)],
    );
    return true;
  } catch (error) {
    console.error('Failed to exchange SSO code:', error);
    redirect(
      res,
      new URL('/?sso=exchange_failed', serviceOrigin).toString(),
      getClearedSSOStateCookieHeader(),
    );
    return true;
  }
}

export async function handleServiceApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next?: Next,
) {
  const url = getRequestUrl(req);

  if (!url) {
    next?.();
    return false;
  }

  if (req.method === 'GET' && url.pathname === '/api/me') {
    const user = getServiceViewerFromRequest(req);

    if (!user) {
      writeJson(res, 401, { user: null });
      return true;
    }

    writeJson(res, 200, { user });
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/api/logout') {
    clearServiceSession(res);
    writeJson(res, 200, { ok: true });
    return true;
  }

  if (url.pathname === getServiceSSOConfig().loginStartPath) {
    return handleLoginStart(req, res);
  }

  if (url.pathname === getServiceSSOConfig().callbackPath) {
    return handleCallback(req, res, url);
  }

  next?.();
  return false;
}
