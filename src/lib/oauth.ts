/**
 * OAuth2 PKCE helpers and flow orchestration for mailbox connection.
 *
 * Handles the frontend side of Authorization Code + PKCE:
 *  1. Generate code_verifier / code_challenge pair
 *  2. Request authorization URL from backend (authenticated)
 *  3. Redirect user to provider (Google / Microsoft)
 *  4. Handle the callback: exchange code for mailbox creation via backend
 */

import { get, post } from "@/lib/api"

const STORAGE_KEY_VERIFIER = "oauth_code_verifier"
const STORAGE_KEY_STATE = "oauth_state"
const STORAGE_KEY_PROVIDER = "oauth_provider"

interface OAuthStartResponse {
  authorization_url: string
  state: string
}

interface ConnectMailboxResponse {
  id: string
  email: string
  provider: string
}

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return base64UrlEncode(new Uint8Array(digest))
}

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join("")
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// ── Flow orchestration ────────────────────────────────────────────────────────

/**
 * Start the OAuth2 flow for connecting a mailbox.
 *
 * Requires the user to be authenticated (JWT in localStorage).
 * After calling this, the browser navigates to the OAuth provider.
 * When the user grants permission, the provider redirects to /auth/callback
 * where handleOAuthCallback() picks up.
 */
export async function startOAuthFlow(provider: string): Promise<void> {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  // Store PKCE verifier and provider in sessionStorage (survives the redirect)
  sessionStorage.setItem(STORAGE_KEY_VERIFIER, codeVerifier)
  sessionStorage.setItem(STORAGE_KEY_PROVIDER, provider)

  const params = new URLSearchParams({
    provider,
    code_challenge: codeChallenge,
  })

  // Authenticated endpoint — JWT is included automatically
  const response = await get<OAuthStartResponse>(
    `/mailboxes/oauth/start?${params.toString()}`,
  )

  // Store the state for validation on callback
  sessionStorage.setItem(STORAGE_KEY_STATE, response.state)

  // Redirect to Google/Microsoft consent screen
  window.location.href = response.authorization_url
}

/**
 * Handle the OAuth callback after the provider redirects back.
 *
 * Validates state, exchanges code for mailbox creation via the backend.
 * The user must already be authenticated (JWT in localStorage).
 */
export async function handleOAuthCallback(
  code: string,
  state: string,
): Promise<ConnectMailboxResponse> {
  const storedState = sessionStorage.getItem(STORAGE_KEY_STATE)
  const codeVerifier = sessionStorage.getItem(STORAGE_KEY_VERIFIER)
  const provider = sessionStorage.getItem(STORAGE_KEY_PROVIDER)

  // Clean up storage
  sessionStorage.removeItem(STORAGE_KEY_STATE)
  sessionStorage.removeItem(STORAGE_KEY_VERIFIER)
  sessionStorage.removeItem(STORAGE_KEY_PROVIDER)

  if (!storedState || state !== storedState) {
    throw new Error("Invalid OAuth state — possible CSRF attack. Please try again.")
  }
  if (!codeVerifier) {
    throw new Error("Missing PKCE code verifier. Please restart the connection flow.")
  }
  if (!provider) {
    throw new Error("Missing OAuth provider. Please restart the connection flow.")
  }

  // Authenticated endpoint — JWT is included automatically
  return post<ConnectMailboxResponse>(
    "/mailboxes/oauth/callback",
    { provider, code, state, code_verifier: codeVerifier },
  )
}
