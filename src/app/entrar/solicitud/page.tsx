import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { StaffSignupForm } from "@/components/admin/staff-signup-form";
import { Logo } from "@/components/logo";
import { getProfile } from "@/lib/auth";
import { isStaffInviteValid } from "@/lib/staff-invite";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("staffSignup.title"), robots: { index: false } };
}

export default async function StaffSignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await getProfile();
  if (profile) {
    notFound();
  }

  const sp = await searchParams;
  const invite =
    typeof sp.invite === "string" ? sp.invite : undefined;

  if (!isStaffInviteValid(invite)) {
    notFound();
  }

  const t = await getTranslations("admin");

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-12">
      <div className="mb-6 text-center">
        <Logo className="mx-auto size-12" />
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          {t("staffSignup.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("staffSignup.intro")}
        </p>
      </div>
      <StaffSignupForm invite={invite ?? ""} />
      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t("staffSignup.privacyNote")}
      </p>
    </div>
  );
}
