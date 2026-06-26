import Link from "next/link";
import { Globe, HeartHandshake, Hospital, LayoutDashboard, LifeBuoy, LogOut, MapPin, MessageCircle, Stethoscope, UserPlus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { logout } from "@/app/admin/actions";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const adminNav = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboard },
  { href: "/admin/desaparecidos", key: "missing", icon: Users },
  { href: "/admin/pistas", key: "tips", icon: MessageCircle },
  { href: "/admin/mapa", key: "markers", icon: MapPin },
  { href: "/admin/ayuda", key: "help", icon: LifeBuoy },
  { href: "/admin/acopio", key: "acopio", icon: Globe },
  { href: "/admin/centros", key: "facilities", icon: Hospital },
  { href: "/admin/pacientes", key: "patients", icon: Stethoscope },
  { href: "/admin/voluntarios", key: "professionals", icon: HeartHandshake },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStaff();
  const t = await getTranslations("admin");

  let pendingApplications = 0;
  if (profile.rol === "admin") {
    const supabase = await createClient();
    const { count } = await supabase
      .from("staff_applications")
      .select("*", { count: "exact", head: true })
      .eq("estado", "pendiente");
    pendingApplications = count ?? 0;
  }

  const navItems =
    profile.rol === "admin"
      ? [
          ...adminNav,
          {
            href: "/admin/solicitudes" as const,
            key: "applications" as const,
            icon: UserPlus,
            badge: pendingApplications,
          },
        ]
      : adminNav;

  return (
    <div className="min-h-full">
      <div className="flag-stripe h-1 w-full" aria-hidden />
      <div className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <Logo className="size-6" />
          <span className="font-semibold">{t("panelTitle")}</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {t(`role.${profile.rol}`)}
          </span>
          <form action={logout} className="ml-auto">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="size-4" />
              {t("logout")}
            </Button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 pb-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              render={<Link href={item.href} />}
              variant="ghost"
              size="sm"
              className="shrink-0"
            >
              <item.icon className="size-4" />
              {t(`section.${item.key}`)}
              {"badge" in item && item.badge > 0 ? (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Button>
          ))}
        </nav>
      </div>
      <main>{children}</main>
    </div>
  );
}
