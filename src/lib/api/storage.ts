const AUTH_TOKEN_KEY = "fedetec.auth.token";
const COMPANY_API_KEY = "fedetec.company.apiKey";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  else window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getCompanyApiKey() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(COMPANY_API_KEY);
}

export function setCompanyApiKey(apiKey: string | null) {
  if (typeof window === "undefined") return;
  if (apiKey) window.localStorage.setItem(COMPANY_API_KEY, apiKey);
  else window.localStorage.removeItem(COMPANY_API_KEY);
}
