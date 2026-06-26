"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { mainNav, reportHref } from "@/config/nav";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flag-stripe h-1 w-full" aria-hidden />
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        <Link
          href="/"
          className="group flex items-center gap-2 font-semibold tracking-tight"
        >
          <Logo className="size-7 transition-transform group-hover:scale-105" />
          <span className="text-lg">{tApp("name")}</span>
        </Link>

        {/* Navegación de escritorio */}
        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label={t("menu")}>
          {mainNav.map((item) => (
            <Button
              key={item.href}
              render={<Link href={item.href} />}
              variant={isActive(item.href) ? "secondary" : "ghost"}
            >
              <item.icon className="size-4" />
              {t(item.key)}
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            render={<Link href={reportHref} />}
            className="hidden sm:inline-flex"
          >
            {t("report")}
          </Button>
          <ThemeToggle />

          {/* Menú móvil */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label={t("menu")}
                />
              }
            >
              <Menu className="size-6" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Logo className="size-6" />
                  {tApp("name")}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2" aria-label={t("menu")}>
                {mainNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium",
                      isActive(item.href)
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-accent",
                    )}
                  >
                    <item.icon className="size-5" />
                    {t(item.key)}
                  </Link>
                ))}
                <Button
                  render={
                    <Link href={reportHref} onClick={() => setOpen(false)} />
                  }
                  size="lg"
                  className="mt-4"
                >
                  {t("report")}
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
