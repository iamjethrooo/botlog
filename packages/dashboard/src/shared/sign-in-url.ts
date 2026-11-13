export function signInUrl(returnPath: string) {
  return `/signin?callbackUrl=${encodeURIComponent(returnPath)}`;
}

export function resolveSignInReturnPath(value: string | undefined, origin: string) {
  if (value) {
    try {
      const url = new URL(value, origin);
      if (url.origin === new URL(origin).origin &&
        (url.pathname === '/' || url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/'))) {
        return url.pathname + url.search + url.hash;
      }
    } catch {
      // Invalid return paths fall back to the server picker.
    }
  }
  return '/dashboard';
}
