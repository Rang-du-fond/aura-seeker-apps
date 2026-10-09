import * as React from "react"
import { ArrowRightIcon, DownloadIcon } from "lucide-react"
import { Link } from "react-router"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Text } from "@workspace/ui/components/text"
import { cn } from "@workspace/ui/lib/utils"

import { DownloadQr } from "@/components/download-qr"
import { HeroPattern } from "@/components/hero-pattern"
import type { MessageKey } from "@/lib/i18n"
import { useLocale, useT } from "@/lib/language"
import { betaDownloadUrl } from "@/lib/links"
import {
  getStatistics,
  searchPanels,
  type Panel,
  type Statistics,
} from "@/lib/places"

const statisticTiles: {
  key: keyof Statistics
  label: MessageKey
  accent: string
}[] = [
  { key: "total", label: "home.statTotal", accent: "border-aura-blue" },
  {
    key: "lastThirtyDays",
    label: "home.statLastThirtyDays",
    accent: "border-aura-green",
  },
  { key: "tags", label: "home.statTags", accent: "border-aura-orange" },
  {
    key: "contributors",
    label: "home.statContributors",
    accent: "border-aura-magenta",
  },
]

const gutter = "px-[clamp(1rem,4vw,3rem)]"
const container = "mx-auto max-w-[1200px]"

export function Home() {
  const t = useT()
  const locale = useLocale()
  const numberFormat = React.useMemo(
    () => new Intl.NumberFormat(locale),
    [locale]
  )
  const dateFormat = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "long" }),
    [locale]
  )

  const [statistics, setStatistics] = React.useState<Statistics | null>(null)
  const [latestPanels, setLatestPanels] = React.useState<Panel[]>([])

  React.useEffect(() => {
    const controller = new AbortController()
    // On failure the tiles keep their dash and the latest panels stay empty.
    getStatistics(controller.signal)
      .then(setStatistics)
      .catch(() => {})
    // The API has no "latest N": ask for the last 30 days and keep three.
    searchPanels(
      {
        after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      controller.signal
    )
      .then((panels) =>
        setLatestPanels(
          panels
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 3)
        )
      )
      .catch(() => {})

    return () => controller.abort()
  }, [])

  return (
    <>
      <section
        className={cn(
          "relative overflow-hidden surface-blue py-[clamp(3.5rem,8vw,7rem)]",
          gutter
        )}
      >
        <HeroPattern className="opacity-[0.22]" />
        <div
          className={cn(
            "hero-content relative flex max-w-[1200px] flex-col gap-7",
            container
          )}
        >
          <Text variant="display">
            <strong>{t("home.heroTitleStrong")}</strong>
            <br />
            {t("home.heroTitleRest")}
          </Text>
          <Text variant="lead" className="max-w-[580px]">
            {t("home.heroLead")}
          </Text>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/map">
                {t("home.exploreMap")}
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#app">{t("home.recordWithApp")}</a>
            </Button>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="stats-title"
        className={cn("surface-slate py-12", gutter)}
      >
        <div className={container}>
          <Text variant="overline" asChild>
            <h2 id="stats-title" className="mb-7">
              {t("home.statsTitle")}
            </h2>
          </Text>
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8">
            {statisticTiles.map(({ key, label, accent }) => (
              <div
                key={label}
                className={cn("flex flex-col gap-2 border-t-3 pt-4", accent)}
              >
                <dt className="order-2 text-[17px]">{t(label)}</dt>
                <dd className="text-[56px] leading-none font-extrabold">
                  {statistics?.[key] != null
                    ? numberFormat.format(statistics[key])
                    : "—"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        id="app"
        aria-labelledby="app-title"
        className={cn("bg-muted py-14", gutter)}
      >
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-8",
            container
          )}
        >
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
            <Text variant="h1" asChild>
              <h2 id="app-title">
                <span className="font-extrabold">
                  {t("home.appTitleStrong")}
                </span>
                <br />
                <span className="font-light">{t("home.appTitleRest")}</span>
              </h2>
            </Text>
            <Text>{t("home.appLead")}</Text>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex max-w-[320px] flex-col gap-2.5">
              <Button asChild size="lg">
                <a href={betaDownloadUrl} target="_blank" rel="noreferrer">
                  <DownloadIcon data-icon="inline-start" />
                  {t("home.downloadBeta")}
                </a>
              </Button>
              <Text variant="muted">{t("home.betaNote")}</Text>
            </div>
            <DownloadQr label={t("home.qrLabel")} className="size-32" />
          </div>
        </div>
      </section>

      <section aria-labelledby="latest-title" className={cn("py-20", gutter)}>
        <div className={cn("flex flex-col gap-7", container)}>
          <Text variant="section" id="latest-title">
            {t("home.latestTitle")}
          </Text>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
            {latestPanels.map((panel) => (
              <Link
                key={panel.id}
                to={`/map?sign=${panel.id}`}
                className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="h-full gap-0 py-0">
                  {panel.imageUrl ? (
                    <img
                      src={panel.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-[180px] w-full bg-muted object-cover"
                    />
                  ) : (
                    <div className="h-[180px] bg-muted" />
                  )}
                  <CardContent className="flex flex-col gap-2 px-5 pt-4.5 pb-5">
                    <div className="flex flex-wrap gap-1.5">
                      {panel.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Text variant="h3" className="font-bold">
                      {panel.title}
                    </Text>
                    <Text variant="muted">
                      {t("home.addedOn", {
                        date: dateFormat.format(new Date(panel.createdAt)),
                      })}
                    </Text>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
