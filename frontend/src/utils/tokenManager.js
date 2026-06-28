/**
 * In-memory access token store.
 *
 * Access tokens live ONLY in JavaScript memory — never in localStorage or
 * sessionStorage. This eliminates XSS token theft: even if an attacker runs
 * arbitrary JS on the page, they cannot exfiltrate a token that is not in
 * any Web Storage API.
 *
 * The refresh token lives in an httpOnly cookie set by the backend, which is
 * completely inaccessible to JavaScript.
 *
 * On page refresh the access token is lost, but the browser automatically
 * sends the httpOnly cookie to POST /api/auth/refresh, which issues a new
 * access token — transparent to the user.
 */

let _accessToken = null;

export const setAccessToken  = (token) => { _accessToken = token; };
export const getAccessToken  = ()      => _accessToken;
export const clearAccessToken = ()     => { _accessToken = null; };
