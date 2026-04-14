import type { IncomingMessage, ServerResponse } from 'node:http';

import { handleServiceApiRequest } from '../server/sso-handler';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleServiceApiRequest(req, res);
}
