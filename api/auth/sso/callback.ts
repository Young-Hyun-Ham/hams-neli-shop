import type { IncomingMessage, ServerResponse } from 'node:http';

import { handleServiceSSOCallback } from '../../../server/sso-handler.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleServiceSSOCallback(req, res);
}
