export type ServiceViewer = {
  id: string;
  loginId: string;
  email: string;
  nickname: string;
  provider: string;
};

function getRequiredEnv(name: keyof ImportMetaEnv, fallback?: string) {
  const value = import.meta.env[name] || fallback;

  if (!value) {
    throw new Error(`${name} is required for SSO login.`);
  }

  return value;
}

export function getSSOConfig() {
  return {
    loginStartPath: import.meta.env.VITE_SSO_LOGIN_START_PATH || '/auth/sso/login',
    meEndpoint: import.meta.env.VITE_SSO_ME_ENDPOINT || '/api/me',
    logoutEndpoint: import.meta.env.VITE_SSO_LOGOUT_ENDPOINT || '/api/logout',
    sessionHintCookieName:
      import.meta.env.VITE_SERVICE_SESSION_HINT_COOKIE_NAME || 'hams_neil_shop_session_hint',
    callbackPath: getRequiredEnv('VITE_SSO_CALLBACK_PATH', '/auth/sso/callback'),
    authOrigin: getRequiredEnv('VITE_SSO_AUTH_ORIGIN', 'http://localhost:3000'),
    serviceOrigin: getRequiredEnv(
      'VITE_SERVICE_ORIGIN',
      typeof window !== 'undefined' ? window.location.origin : '',
    ),
    clientId: getRequiredEnv('VITE_SSO_CLIENT_ID', 'service-3002'),
  };
}

export function beginSSOLogin() {
  const { loginStartPath } = getSSOConfig();
  window.location.assign(loginStartPath);
}

export function hasServiceSessionHint() {
  if (typeof document === 'undefined') {
    return false;
  }

  const { sessionHintCookieName } = getSSOConfig();

  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .some((part) => part.startsWith(`${sessionHintCookieName}=`));
}

export async function fetchServiceViewer() {
  const { meEndpoint } = getSSOConfig();

  const response = await fetch(meEndpoint, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch service session.');
  }

  const payload = (await response.json()) as {
    user?: ServiceViewer | null;
  };

  return payload.user ?? null;
}

export async function logoutService() {
  const { logoutEndpoint } = getSSOConfig();
  const response = await fetch(logoutEndpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to logout from service.');
  }
}
