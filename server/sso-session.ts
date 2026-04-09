import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

type ServiceViewer = {
  id: string;
  loginId: string;
  email: string;
  nickname: string;
  provider: string;
};

type ServiceSessionPayload = {
  user: ServiceViewer;
  issuedAt: number;
  expiresAt: number;
};

type SSOStatePayload = {
  state: string;
  issuedAt: number;
  expiresAt: number;
};

const SERVICE_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SSO_STATE_TTL_SECONDS = 60 * 10;

function getSessionSecret() {
  return process.env.SERVICE_SESSION_SECRET || 'dev-only-service-session-secret-change-me';
}

function getSessionCookieName() {
  return process.env.SERVICE_SESSION_COOKIE_NAME || 'hams_neil_shop_session';
}

function getSessionHintCookieName() {
  return process.env.SERVICE_SESSION_HINT_COOKIE_NAME || 'hams_neil_shop_session_hint';
}

function getSSOStateCookieName() {
  return process.env.SERVICE_SSO_STATE_COOKIE_NAME || 'hams_neil_shop_sso_state';
}

function getCookieSecure() {
  return process.env.NODE_ENV === 'production';
}

function sign(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function decode<T>(token: string) {
  const [body, signature] = token.split('.');

  if (!body || !signature) {
    return null;
  }

  const expected = sign(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

function parseCookies(header: string | undefined) {
  const cookies = new Map<string, string>();

  if (!header) {
    return cookies;
  }

  for (const part of header.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');

    if (!rawName) {
      continue;
    }

    cookies.set(rawName, rawValue.join('='));
  }

  return cookies;
}

function createCookieHeader(name: string, value: string, maxAge: number) {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];

  if (getCookieSecure()) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function createReadableCookieHeader(name: string, value: string, maxAge: number) {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];

  if (getCookieSecure()) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function getServiceViewerFromRequest(req: IncomingMessage) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.get(getSessionCookieName());

  if (!token) {
    return null;
  }

  const payload = decode<ServiceSessionPayload>(token);

  if (!payload?.user || payload.expiresAt < Date.now()) {
    return null;
  }

  return payload.user;
}

export function clearServiceSession(res: ServerResponse) {
  res.setHeader(
    'Set-Cookie',
    [
      createCookieHeader(getSessionCookieName(), '', 0),
      createReadableCookieHeader(getSessionHintCookieName(), '', 0),
    ],
  );
}

export function createServiceSessionCookie(user: ServiceViewer) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SERVICE_SESSION_TTL_SECONDS * 1000;
  const body = Buffer.from(
    JSON.stringify({
      user,
      issuedAt,
      expiresAt,
    } satisfies ServiceSessionPayload),
  ).toString('base64url');

  return [
    createCookieHeader(
      getSessionCookieName(),
      `${body}.${sign(body)}`,
      SERVICE_SESSION_TTL_SECONDS,
    ),
    createReadableCookieHeader(getSessionHintCookieName(), '1', SERVICE_SESSION_TTL_SECONDS),
  ];
}

export function createSSOStateCookie(state: string) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SSO_STATE_TTL_SECONDS * 1000;
  const body = Buffer.from(
    JSON.stringify({
      state,
      issuedAt,
      expiresAt,
    } satisfies SSOStatePayload),
  ).toString('base64url');

  return createCookieHeader(
    getSSOStateCookieName(),
    `${body}.${sign(body)}`,
    SSO_STATE_TTL_SECONDS,
  );
}

export function clearSSOStateCookie(res: ServerResponse) {
  res.setHeader(
    'Set-Cookie',
    createCookieHeader(getSSOStateCookieName(), '', 0),
  );
}

export function getClearedSSOStateCookieHeader() {
  return createCookieHeader(getSSOStateCookieName(), '', 0);
}

export function getSSOStateFromRequest(req: IncomingMessage) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.get(getSSOStateCookieName());

  if (!token) {
    return null;
  }

  const payload = decode<SSOStatePayload>(token);

  if (!payload?.state || payload.expiresAt < Date.now()) {
    return null;
  }

  return payload.state;
}
