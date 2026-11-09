export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return Boolean(host) && originUrl.host === host;
  } catch {
    return false;
  }
}
