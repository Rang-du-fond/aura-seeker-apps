import { cn } from "@workspace/ui/lib/utils"

import { qrPath, qrSize } from "@/components/download-qr-data"

// Blank margin around the code, in modules: scanners need at least four.
const quietZone = 4

// The QR code of the beta download page. Always dark on white, whatever the
// theme: scanners expect that contrast.
export function DownloadQr({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  const side = qrSize + quietZone * 2

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`${-quietZone} ${-quietZone} ${side} ${side}`}
      shapeRendering="crispEdges"
      className={cn("rounded-xl bg-white", className)}
    >
      <path d={qrPath} fill="#000" />
    </svg>
  )
}
