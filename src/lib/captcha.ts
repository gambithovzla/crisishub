import "server-only";

/**
 * Verifica un token de Cloudflare Turnstile.
 * Si no hay TURNSTILE_SECRET_KEY configurada, el captcha está DESACTIVADO y
 * la verificación devuelve true (no bloquea). Para activarlo, define:
 *   TURNSTILE_SECRET_KEY (servidor) y NEXT_PUBLIC_TURNSTILE_SITE_KEY (cliente).
 */
export async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // captcha desactivado

  if (!token) return false;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      },
    );
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export const CAPTCHA_ERROR =
  "No pudimos verificar que no eres un robot. Recarga e inténtalo de nuevo.";
