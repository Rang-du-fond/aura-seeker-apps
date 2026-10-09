// Facts shown on the legal pages. `null` is displayed as "[à compléter]".
export const site = {
  // Name of the person legally responsible for what the site publishes.
  publicationDirector: "Mathéo Galuba (matheo.galu56@gmail.com)" as
    string | null,
  // Set VITE_CONTACT_EMAIL at build time. Without it, the pages point to the
  // project's GitHub issues instead.
  contactEmail: (import.meta.env.VITE_CONTACT_EMAIL || null) as string | null,
  issuesUrl: "https://github.com/Rang-du-fond/aura-seeker-apps/issues",
}
