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

export const issuer = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

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
 * then clears local tokens.
 */
export async function signOutHostedUI() {
  const logoutUri = getRedirectUri();

  const logoutUrl =
    `https://${COGNITO_DOMAIN}/logout` +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&logout_uri=${encodeURIComponent(logoutUri)}`;

  // openAuthSessionAsync will open Safari and return to the app
  await WebBrowser.openAuthSessionAsync(logoutUrl, logoutUri);
  await signOutLocal();
}
