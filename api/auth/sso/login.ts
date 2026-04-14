import type { IncomingMessage, ServerResponse } from 'node:http';

import { handleServiceSSOLogin } from '../../../server/sso-handler';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleServiceSSOLogin(req, res);
}
