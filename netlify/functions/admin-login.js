// Admin sign-in. Replaces the old ADMIN_PIN = '1234' that shipped in the
// public JavaScript bundle.
//
// The password is compared here and never leaves the server. What goes back is
// a short-lived HMAC token the browser cannot forge — and which admin-action.js
// re-verifies on every privileged call.

import { json, readPost, haveService, secretEq, slowFail, mintAdminToken } from './_ctd.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

export default async (request) => {
  const { res, body } = await readPost(request);
  if (res) return res;

  if (!haveService() || !ADMIN_PASSWORD || !process.env.ADMIN_TOKEN_SECRET) {
    return json(503, { error: 'not_configured' });
  }

  const password = String(body?.password || '');
  if (!secretEq(password, ADMIN_PASSWORD)) {
    await slowFail();
    return json(401, { error: 'That password isn’t right.' });
  }

  const { token, exp } = mintAdminToken();
  return json(200, { ok: true, token, exp });
};
