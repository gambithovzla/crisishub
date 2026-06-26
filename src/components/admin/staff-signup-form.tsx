"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { submitStaffApplication, type StaffSignupState } from "@/app/entrar/solicitud/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initial: StaffSignupState = { ok: true };

export function StaffSignupForm({ invite }: { invite: string }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(
    submitStaffApplication,
    initial,
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const errorKey = state.error;
  const errorMsg = errorKey ? t(`staffSignup.errors.${errorKey}`) : null;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="invite" value={invite} />

      {errorMsg ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMsg}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="nombre">{t("staffSignup.nombre")}</Label>
        <Input
          id="nombre"
          name="nombre"
          required
          autoComplete="name"
          className="h-11 text-base"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-11 text-base"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 text-base"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">{t("staffSignup.confirmPassword")}</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-11 text-base"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mensaje">{t("staffSignup.mensaje")}</Label>
        <Textarea
          id="mensaje"
          name="mensaje"
          rows={3}
          placeholder={t("staffSignup.mensajePlaceholder")}
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">
          {t("staffSignup.mensajeHint")}
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full text-base"
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          t("staffSignup.submit")
        )}
      </Button>
    </form>
  );
}
