import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { RegisterSW } from "@/components/register-sw";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    metadataBase: new URL("https://vzla.lat"),
    title: {
      default: `${t("name")} — ${t("tagline")}`,
      template: `%s · ${t("name")}`,
    },
    description: t("description"),
    applicationName: t("name"),
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "default", title: t("name") },
    icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
    openGraph: {
      type: "website",
      locale: "es_VE",
      siteName: t("name"),
      title: `${t("name")} — ${t("tagline")}`,
      description: t("description"),
    },
    twitter: { card: "summary" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1d70b8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("nav");
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Preconnect para acelerar imágenes y mapas en conexiones lentas (2G) */}
        {supabaseOrigin ? (
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="" />
        ) : null}
        <link
          rel="preconnect"
          href="https://a.tile.openstreetmap.org"
          crossOrigin=""
        />
        <link rel="dns-prefetch" href="https://b.tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://c.tile.openstreetmap.org" />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <a href="#contenido" className="skip-link">
              {t("skipToContent")}
            </a>
            <SiteHeader />
            <main id="contenido" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </NextIntlClientProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
