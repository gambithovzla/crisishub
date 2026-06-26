"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { BadgeCheck, Eye, EyeOff, FileSearch, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getCredentialUrl,
  removeVolunteer,
  setVerified,
  setVolunteerModeration,
} from "@/app/admin/voluntarios/actions";
import type { ModerationStatus } from "@/lib/supabase/types";

export function VolunteerAdminActions({
  id,
  verified,
  moderation,
}: {
  id: number;
  verified: boolean;
  moderation: ModerationStatus;
}) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? "Error");
      else toast.success("Hecho");
    });
  }

  async function viewCredential() {
    const r = await getCredentialUrl(id);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    window.open(r.url, "_blank", "noopener");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={viewCredential}
        disabled={pending}
      >
        <FileSearch className="size-4" />
        Ver credencial
      </Button>
      {verified ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => run(() => setVerified(id, false))}
          disabled={pending}
        >
          <X className="size-4" />
          Quitar verificación
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => run(() => setVerified(id, true))}
          disabled={pending}
        >
          <BadgeCheck className="size-4" />
          Verificar
        </Button>
      )}
      {moderation === "visible" ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => run(() => setVolunteerModeration(id, "hidden"))}
          disabled={pending}
        >
          <EyeOff className="size-4" />
          Ocultar
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => run(() => setVolunteerModeration(id, "visible"))}
          disabled={pending}
        >
          <Eye className="size-4" />
          Mostrar
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        onClick={() => {
          if (confirm("¿Eliminar este registro?"))
            run(() => removeVolunteer(id));
        }}
        disabled={pending}
      >
        <Trash2 className="size-4" />
        Eliminar
      </Button>
    </div>
  );
}
