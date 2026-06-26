import Link from "next/link";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Página no encontrada
      </h1>
      <p className="mt-2 text-muted-foreground text-pretty">
        La página que buscas no existe o fue movida.
      </p>
      <Button render={<Link href="/" />} size="lg" className="mt-6">
        <Home className="size-5" />
        Ir al inicio
      </Button>
    </div>
  );
}
