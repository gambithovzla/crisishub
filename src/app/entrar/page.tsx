import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";
import { getProfile } from "@/lib/auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("loginTitle") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Si ya es staff, directo al panel.
  const profile = await getProfile();
  if (profile) redirect("/admin");

  const t = await getTranslations("admin");
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/admin";

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-12">
      <div className="mb-6 text-center">
        <Logo className="mx-auto size-12" />
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          {t("loginTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("loginIntro")}</p>
      </div>
      <LoginForm next={next} />
    </div>
  );
}
