const legalLinks = ["Mentions légales", "Accessibilité", "Données personnelles"]

export function SiteFooter() {
  return (
    <footer className="surface-slate px-[clamp(1rem,4vw,3rem)] pt-12 pb-8">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 text-sm leading-relaxed">
        <div>
          <strong className="block text-[15px]">Rang du fond</strong>
          Une blague présentée par le collectif RDF.
        </div>
        <div className="col-span-full sm:col-span-2">
          <strong className="block text-[15px]">Site non officiel</strong>
          Ce site n'est pas affilié à la Région Auvergne-Rhône-Alpes ni à
          Auvergne-Rhône-Alpes.
        </div>
        {/* TODO: point these at the legal pages once they exist. */}
        <div className="flex flex-col gap-1">
          {legalLinks.map((label) => (
            <a key={label} href="#" className="text-link underline">
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
