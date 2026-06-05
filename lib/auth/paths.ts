export const DEFAULT_AUTHENTICATED_PATH = "/";

export function safeAuthenticatedPath(next: string | null | undefined): string {
  const value = (next ?? DEFAULT_AUTHENTICATED_PATH).trim();
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return DEFAULT_AUTHENTICATED_PATH;
}

export function signupLandingPath(next?: string | null): string {
  const path = next?.trim();
  if (path && path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return `${DEFAULT_AUTHENTICATED_PATH}?event=signup`;
}
