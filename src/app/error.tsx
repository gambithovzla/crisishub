"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Algo salió mal</h1>
      <p className="mt-2 text-muted-foreground text-pretty">
        Ocurrió un error inesperado. Vuelve a intentarlo.
      </p>
      <Button onClick={() => reset()} size="lg" className="mt-6">
        <RotateCcw className="size-5" />
        Reintentar
      </Button>
    </div>
  );
}
