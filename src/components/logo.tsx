import { cn } from "@/lib/utils";

// Colores de la bandera de Venezuela.
const FLAG_YELLOW = "#ffce00";
const FLAG_BLUE = "#0033a0";
const FLAG_RED = "#ef3340";

// Silueta de pin de mapa (gota). El relleno se recorta a esta forma.
const PIN_PATH =
  "M12 1.4c-4.4 0-7.9 3.4-7.9 7.7 0 5.4 6.6 12.1 7.9 13.4 1.3-1.3 7.9-8 7.9-13.4 0-4.3-3.5-7.7-7.9-7.7z";

// Arco de 8 estrellas blancas, como en la bandera (curva cóncava hacia arriba).
const STAR_CENTERS = Array.from({ length: 8 }, (_, i) => {
  const start = (35 * Math.PI) / 180;
  const end = (145 * Math.PI) / 180;
  const angle = start + ((end - start) * i) / 7;
  const cx = 12 + 5.4 * Math.cos(angle);
  const cy = 6.6 + 5.4 * Math.sin(angle);
  return { cx, cy };
});

function starPath(cx: number, cy: number, r: number) {
  const inner = r * 0.42;
  let d = "";
  for (let k = 0; k < 5; k++) {
    const outerAngle = (-90 + k * 72) * (Math.PI / 180);
    const innerAngle = (-90 + 36 + k * 72) * (Math.PI / 180);
    const ox = cx + r * Math.cos(outerAngle);
    const oy = cy + r * Math.sin(outerAngle);
    const ix = cx + inner * Math.cos(innerAngle);
    const iy = cy + inner * Math.sin(innerAngle);
    d += `${k === 0 ? "M" : "L"}${ox.toFixed(2)} ${oy.toFixed(2)}L${ix.toFixed(2)} ${iy.toFixed(2)}`;
  }
  return `${d}Z`;
}

/**
 * Logo de CrisisHub: pin de mapa con la tricolor de Venezuela
 * y el arco de 8 estrellas de la bandera.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-7", className)}
      role="img"
      aria-label="CrisisHub Venezuela"
    >
      <defs>
        <clipPath id="ch-pin">
          <path d={PIN_PATH} />
        </clipPath>
      </defs>

      {/* Sombra/contorno sutil para definir el pin sobre cualquier fondo */}
      <path
        d={PIN_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        className="text-foreground/15"
      />

      {/* Bandas de la bandera, recortadas a la forma del pin */}
      <g clipPath="url(#ch-pin)">
        <rect x="0" y="0" width="24" height="8" fill={FLAG_YELLOW} />
        <rect x="0" y="8" width="24" height="8" fill={FLAG_BLUE} />
        <rect x="0" y="16" width="24" height="8" fill={FLAG_RED} />
        {STAR_CENTERS.map((s, i) => (
          <path key={i} d={starPath(s.cx, s.cy, 0.95)} fill="#ffffff" />
        ))}
      </g>
    </svg>
  );
}
