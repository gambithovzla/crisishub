import { getRequestConfig } from "next-intl/server";

// Idioma único por ahora (español). La estructura queda lista para
// añadir más idiomas/países: bastará con introducir routing por locale
// y nuevos archivos en /messages.
export const defaultLocale = "es" as const;

export default getRequestConfig(async () => {
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
