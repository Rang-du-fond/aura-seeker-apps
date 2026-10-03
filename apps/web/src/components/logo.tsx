import ideogram from "@/assets/logo/ideogram.svg"

// The ideogram comes from the official logo.
export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <img src={ideogram} alt="" className="size-11 flex-none" />
      <span className="flex flex-col leading-none">
        <span className="text-2xl font-bold tracking-tight">La Région</span>
        <span className="text-[11px]">Auvergne-Rhône-Alpes</span>
      </span>
    </span>
  )
}
