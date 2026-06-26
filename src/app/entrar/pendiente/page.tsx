import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Clock, XCircle } from "lucide-react";

import { logout } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { getProfile, getStaffApplication, getUser } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("staffPending.title"), robots: { index: false } };
}

export default async function StaffPendingPage() {
  const user = await getUser();
  if (!user) redirect("/entrar");

  const profile = await getProfile();
  if (profile) redirect("/admin");

  const application = await getStaffApplication();
  if (!application) redirect("/entrar");

  const t = await getTranslations("admin");
  const rejected = application.estado === "rechazado";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="mb-6 text-center">
        <Logo className="mx-auto size-12" />
        {rejected ? (
          <XCircle className="mx-auto mt-4 size-10 text-destructive" />
        ) : (
          <Clock className="mx-auto mt-4 size-10 text-primary" />
        )}
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          {t(rejected ? "staffPending.rejectedTitle" : "staffPending.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(rejected ? "staffPending.rejectedIntro" : "staffPending.intro")}
        </p>
      </div>

      {!rejected ? (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <p>
            <span className="font-medium">{t("staffSignup.nombre")}:</span>{" "}
            {application.nombre}
          </p>
          <p className="mt-1">
            <span className="font-medium">{t("email")}:</span>{" "}
            {application.email}
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-2">
        <form action={logout}>
          <Button type="submit" variant="outline" className="h-11 w-full">
            {t("logout")}
          </Button>
        </form>
        <Button
          render={<Link href="/" />}
          variant="ghost"
          className="h-11 w-full"
        >
          {t("staffPending.backHome")}
        </Button>
      </div>
    </div>
  );
}
