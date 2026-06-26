"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** true si el captcha está activado (hay site key configurada). */
export const CAPTCHA_ENABLED = !!SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

/**
 * Widget de Cloudflare Turnstile. Si no hay NEXT_PUBLIC_TURNSTILE_SITE_KEY,
 * no renderiza nada (captcha desactivado). Llama a onToken con el token.
 */
export function Captcha({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;

    function render() {
      if (!window.turnstile || !ref.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onToken(token),
        "error-callback": () => onToken(""),
        "expired-callback": () => onToken(""),
      });
    }

    if (window.turnstile) {
      render();
    } else {
      const id = "cf-turnstile-script";
      if (!document.getElementById(id)) {
        const s = document.createElement("script");
        s.id = id;
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        s.async = true;
        s.defer = true;
        s.onload = render;
        document.head.appendChild(s);
      } else {
        const timer = setInterval(() => {
          if (window.turnstile) {
            clearInterval(timer);
            render();
          }
        }, 200);
        return () => clearInterval(timer);
      }
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="my-2" />;
}
