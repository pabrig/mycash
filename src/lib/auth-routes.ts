/** Rutas accesibles sin sesión: login, callback del magic link, unirse a un grupo. */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/join/")
  );
}

/** Login / join / primer armado de cuenta: sin sidebar ni nav. */
export function isAuthShellPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/join/") ||
    pathname === "/onboarding"
  );
}

export function isOnboardingPath(pathname: string): boolean {
  return pathname === "/onboarding";
}

/** Localhost / loopback: se puede reabrir el onboarding aunque ya esté hecho. */
export function isLocalDevHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}
