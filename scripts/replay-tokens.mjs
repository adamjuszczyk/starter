// replay-tokens.mjs — the tokens verify-rls.mjs sends to PostgREST on the replay (Decided 13).
//
// The replay has no Auth service: nobody signs in. PostgREST is started with a JWT secret
// (scripts/verify-rls-replay.sh), and a request is whoever its token says it is. These are HS256 JWTs signed with
// that secret, with the claims PostgREST and auth.uid() read:
//
//   anon           { role: "anon" }                                        a signed-out visitor
//   authenticated  { role: "authenticated", sub: <user id>, aud: "authenticated" }   one per user
//
// every one with `iat` and a one-hour `exp`. A token signed with any other secret is refused by PostgREST (PGRST301),
// which verify-rls.mjs reports as a FAIL on every probe, never a pass.
//
// USER_A and USER_B are the two test users. scripts/verify-rls-fixture/seed.sql inserts them into auth.users under
// these ids, and verify-rls.test.mjs fails if the two files drift apart. An app that has tables does the same in
// supabase/verify-rls-seed.sql: the two users under these ids, and at least one row of each in every table of its
// access list. scripts/verify-rls-replay.sh applies that file after the migrations (when it exists); with no rows for
// A, verify-rls.mjs fails the owner probe ("A reads 0 own rows").

import { createHmac } from 'node:crypto';

export const USER_A = '00000000-0000-4000-8000-00000000000a';
export const USER_B = '00000000-0000-4000-8000-00000000000b';
export const TOKEN_LIFETIME_SECONDS = 3600;

// A UUID's shape: enough to refuse anything that is not hex and dashes before it becomes a claim.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const b64url = (text) => Buffer.from(text).toString('base64url');

// header.payload.signature, HS256 (HMAC-SHA256 over "header.payload", base64url, no padding).
export function signJwt(claims, secret) {
  if (typeof secret !== 'string' || secret.length === 0) throw new Error('replay-tokens: no JWT secret');
  const signingInput = `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(claims))}`;
  return `${signingInput}.${createHmac('sha256', secret).update(signingInput).digest('base64url')}`;
}

// `now` (milliseconds) is a parameter so a test can pin the clock.
export function anonToken(secret, now = Date.now()) {
  const iat = Math.floor(now / 1000);
  return signJwt({ role: 'anon', iat, exp: iat + TOKEN_LIFETIME_SECONDS }, secret);
}

export function userToken(secret, userId, now = Date.now()) {
  if (typeof userId !== 'string' || !UUID_RE.test(userId)) throw new Error('replay-tokens: a user id must be a UUID');
  const iat = Math.floor(now / 1000);
  return signJwt(
    { role: 'authenticated', sub: userId, aud: 'authenticated', iat, exp: iat + TOKEN_LIFETIME_SECONDS },
    secret,
  );
}
