import * as React from "react"

import { Text } from "@workspace/ui/components/text"

import type { MessageKey } from "@/lib/i18n"
import { useT } from "@/lib/language"
import { site } from "@/lib/site"

type Values = Record<string, string | number>
// A paragraph: a key, or a key with the values its text takes.
type Line = MessageKey | [MessageKey, Values]
type Section = {
  title: MessageKey
  paragraphs?: Line[]
  // Shown as a bulleted list, after the paragraphs.
  items?: Line[]
  // Ends the section with the way to reach the publisher.
  contact?: boolean
}

// How to reach the publisher: by email when an address is configured, through
// the project's GitHub issues otherwise.
function Contact() {
  const t = useT()

  return (
    <Text>
      <a
        href={
          site.contactEmail ? `mailto:${site.contactEmail}` : site.issuesUrl
        }
        className="text-link underline"
      >
        {site.contactEmail
          ? t("info.contactEmail", { email: site.contactEmail })
          : t("info.contactGithub")}
      </a>
    </Text>
  )
}

// Layout of the text pages linked from the footer.
function InfoPage({
  title,
  intro,
  sections,
}: {
  title: MessageKey
  intro?: Line
  sections: Section[]
}) {
  const t = useT()
  const text = (line: Line) =>
    typeof line === "string" ? t(line) : t(line[0], line[1])

  // Reached from the footer, at the bottom of another page.
  React.useEffect(() => window.scrollTo(0, 0), [])

  return (
    <article className="mx-auto flex max-w-[760px] flex-col gap-10 px-[clamp(1rem,4vw,3rem)] py-16">
      <header className="flex flex-col gap-4">
        <Text variant="h1">{t(title)}</Text>
        {intro && <Text variant="lead">{text(intro)}</Text>}
      </header>
      {sections.map(({ title, paragraphs = [], items = [], contact }) => (
        <section key={title} className="flex flex-col gap-3">
          <Text variant="h2">{t(title)}</Text>
          {paragraphs.map((line) => (
            <Text key={typeof line === "string" ? line : line[0]}>
              {text(line)}
            </Text>
          ))}
          {items.length > 0 && (
            <ul className="flex list-disc flex-col gap-2 pl-6">
              {items.map((line) => (
                <li key={typeof line === "string" ? line : line[0]}>
                  {text(line)}
                </li>
              ))}
            </ul>
          )}
          {contact && <Contact />}
        </section>
      ))}
    </article>
  )
}

export function LegalNotice() {
  const t = useT()
  const missing = t("info.toComplete")

  return (
    <InfoPage
      title="legal.title"
      sections={[
        {
          title: "legal.publisherTitle",
          paragraphs: [
            ["legal.publisherText", { publisher: t("info.publisher") }],
            ["legal.director", { name: site.publicationDirector ?? missing }],
          ],
        },
        {
          title: "legal.contactTitle",
          paragraphs: ["legal.contactText"],
          contact: true,
        },
        {
          title: "legal.hostTitle",
          paragraphs: ["legal.hostText"],
        },
        { title: "legal.contentTitle", paragraphs: ["legal.contentText"] },
        {
          title: "legal.ipTitle",
          paragraphs: ["legal.ipRegion", "legal.ipPhotos", "legal.ipMap"],
        },
      ]}
    />
  )
}

export function Accessibility() {
  return (
    <InfoPage
      title="accessibility.title"
      intro="accessibility.intro"
      sections={[
        {
          title: "accessibility.doneTitle",
          items: [
            "accessibility.doneKeyboard",
            "accessibility.doneLabels",
            "accessibility.doneThemes",
            "accessibility.doneLanguages",
            "accessibility.doneList",
          ],
        },
        {
          title: "accessibility.limitsTitle",
          items: [
            "accessibility.limitsMap",
            "accessibility.limitsPhotos",
            "accessibility.limitsContent",
          ],
        },
        {
          title: "accessibility.reportTitle",
          paragraphs: ["accessibility.reportText"],
          contact: true,
        },
      ]}
    />
  )
}

export function Privacy() {
  const t = useT()

  return (
    <InfoPage
      title="privacy.title"
      intro={["privacy.intro", { publisher: t("info.publisher") }]}
      sections={[
        {
          title: "privacy.siteTitle",
          items: [
            "privacy.siteNoAccount",
            "privacy.siteStorage",
            "privacy.siteLogs",
          ],
        },
        {
          title: "privacy.thirdTitle",
          items: [
            "privacy.thirdMap",
            "privacy.thirdPosition",
            "privacy.thirdGithub",
          ],
        },
        {
          title: "privacy.appTitle",
          items: [
            "privacy.appAccount",
            "privacy.appSigns",
            "privacy.appPosition",
            "privacy.appDevices",
            "privacy.appGoogle",
          ],
        },
        {
          title: "privacy.rightsTitle",
          paragraphs: [
            "privacy.rightsList",
            "privacy.rightsSelf",
            "privacy.rightsCnil",
            "privacy.rightsContact",
          ],
          contact: true,
        },
      ]}
    />
  )
}
