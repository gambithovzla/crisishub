import { WifiOff } from "lucide-react";

export const metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <WifiOff className="size-12 text-muted-foreground" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Sin conexión</h1>
      <p className="mt-2 text-muted-foreground text-pretty">
        No hay internet en este momento. Revisa tu conexión e inténtalo de nuevo.
        Lo que ya hayas abierto puede seguir disponible.
      </p>
    </div>
  );
}
