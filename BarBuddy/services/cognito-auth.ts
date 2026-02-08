import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

/**
 * Cognito Hosted UI auth for Expo Dev Client / iOS Simulator.
 * Uses Authorization Code + PKCE.
 *
 * Expected redirectUri in dev client / simulator:
 *   barbuddy://auth
 *
 * IMPORTANT:
 * - This is NOT meant for Expo Go proxy flow.
 * - Use an EAS dev client (simulator) so deep links work reliably.
 */

// ====== YOUR COGNITO CONFIG ======
const REGION = "us-east-1";
const USER_POOL_ID = "us-east-1_0WHxHJ2Lf";
const CLIENT_ID = "6of9o1tr4up1au2hjns8gmfjti";
const COGNITO_DOMAIN = "us-east-10whxhj2lf.auth.us-east-1.amazoncognito.com";

// Manual discovery endpoints (stable for Cognito Hosted UI)
const discovery = {
  authorizationEndpoint: `https://${COGNITO_DOMAIN}/oauth2/authorize`,
  tokenEndpoint: `https://${COGNITO_DOMAIN}/oauth2/token`,
  revocationEndpoint: `https://${COGNITO_DOMAIN}/oauth2/revoke`,
};

// SecureStore keys
const K_ACCESS = "access_token";
const K_ID = "id_token";
const K_REFRESH = "refresh_token";

/** Buffer in seconds – refresh tokens before they actually expire */
const EXPIRY_BUFFER_SECONDS = 60;

export const issuer = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

// ────────────────────────────────────────────
// Token expiry helpers
// ────────────────────────────────────────────

/**
 * Decode a JWT payload (base64url) without verifying the signature.
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // base64url → base64
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) base64 += "=";
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/**
 * Returns `true` when the access or ID token is expired (or will expire
 * within `EXPIRY_BUFFER_SECONDS`).
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true; // treat un-parseable tokens as expired
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= payload.exp - EXPIRY_BUFFER_SECONDS;
}

// ────────────────────────────────────────────
// Token refresh
// ────────────────────────────────────────────

/**
 * Use the stored refresh token to obtain new access + id tokens from
 * Cognito's token endpoint.  Stores the new tokens and returns `true`
 * on success, `false` if the refresh token is missing / expired / revoked.
 */
export async function refreshTokens(): Promise<boolean> {
  try {
    const refreshToken = await SecureStore.getItemAsync(K_REFRESH);
    if (!refreshToken) {
      console.log("[auth] No refresh token stored – cannot refresh");
      return false;
    }

    console.log("[auth] Refreshing tokens…");

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }).toString();

    const response = await fetch(discovery.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[auth] Token refresh failed:", response.status, errText);
      return false;
    }

    const data = await response.json();

    if (data.access_token) await SecureStore.setItemAsync(K_ACCESS, data.access_token);
    if (data.id_token) await SecureStore.setItemAsync(K_ID, data.id_token);
    // Cognito does NOT return a new refresh token on refresh_token grant –
    // the original refresh token stays valid until it expires.

    console.log("[auth] Tokens refreshed successfully");
    return true;
  } catch (error) {
    console.error("[auth] Token refresh error:", error);
    return false;
  }
}

/**
 * Returns a valid access token, refreshing first if expired.
 * Returns `null` when no valid session exists.
 */
export async function getValidAccessToken(): Promise<string | null> {
  let token = await SecureStore.getItemAsync(K_ACCESS);
  if (token && !isTokenExpired(token)) return token;

  // Try to refresh
  const ok = await refreshTokens();
  if (!ok) return null;

  return SecureStore.getItemAsync(K_ACCESS);
}

/**
 * Returns a valid ID token, refreshing first if expired.
 * Returns `null` when no valid session exists.
 */
export async function getValidIdToken(): Promise<string | null> {
  let token = await SecureStore.getItemAsync(K_ID);
  if (token && !isTokenExpired(token)) return token;

  const ok = await refreshTokens();
  if (!ok) return null;

  return SecureStore.getItemAsync(K_ID);
}

// Use deep link redirect (works in dev client / simulator)
export function getRedirectUri(): string {
  const uri = AuthSession.makeRedirectUri({
    scheme: "barbuddy",
    path: "auth",
  });
  console.log("[auth] redirectUri =", uri);
  return uri;
}

export async function signInWithCognito() {
  const redirectUri = getRedirectUri();

  const request = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: ["openid", "email", "profile"],
    usePKCE: true,
  });

  // Opens system browser and returns to barbuddy://auth
  const result = await request.promptAsync(discovery);

  if (result.type !== "success" || !result.params?.code) {
    throw new Error(`Login failed: ${result.type}`);
  }

  const tokens = await AuthSession.exchangeCodeAsync(
    {
      clientId: CLIENT_ID,
      code: result.params.code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier ?? "",
      },
    },
    discovery
  );

  if (tokens.accessToken) await SecureStore.setItemAsync(K_ACCESS, tokens.accessToken);
  if (tokens.idToken) await SecureStore.setItemAsync(K_ID, tokens.idToken);
  if (tokens.refreshToken) await SecureStore.setItemAsync(K_REFRESH, tokens.refreshToken);

  return tokens;
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(K_ACCESS);
}

export async function getIdToken() {
  return SecureStore.getItemAsync(K_ID);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(K_REFRESH);
}

export async function signOutLocal() {
  await SecureStore.deleteItemAsync(K_ACCESS);
  await SecureStore.deleteItemAsync(K_ID);
  await SecureStore.deleteItemAsync(K_REFRESH);
}

/**
 * Ends the Cognito browser session too (recommended),
 * revokes the refresh token, then clears local tokens.
 * This ensures the user must re-authenticate next time.
 */
export async function signOutHostedUI() {
  // 1. Revoke the refresh token so it can't be reused
  try {
    const refreshToken = await SecureStore.getItemAsync(K_REFRESH);
    if (refreshToken) {
      const body = new URLSearchParams({
        token: refreshToken,
        client_id: CLIENT_ID,
      }).toString();

      await fetch(discovery.revocationEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      console.log("[auth] Refresh token revoked");
    }
  } catch (e) {
    console.warn("[auth] Failed to revoke refresh token:", e);
  }

  // 2. End the Cognito hosted-UI browser session
  const logoutUri = getRedirectUri();

  const logoutUrl =
    `https://${COGNITO_DOMAIN}/logout` +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&logout_uri=${encodeURIComponent(logoutUri)}`;

  // openAuthSessionAsync will open Safari and return to the app
  await WebBrowser.openAuthSessionAsync(logoutUrl, logoutUri);

  // 3. Clear all local tokens
  await signOutLocal();
}
