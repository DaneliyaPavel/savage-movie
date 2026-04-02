/**
 * In-memory token store.
 * Хранит access_token в памяти (не в localStorage) — защита от XSS.
 * Используется client.ts и auth.ts без circular dependency.
 */

let _accessToken: string | null = null

export function getAccessToken(): string | null {
  return _accessToken
}

export function setAccessToken(token: string | null): void {
  _accessToken = token
}
