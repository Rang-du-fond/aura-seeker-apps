// Translation shared by the web and the mobile apps. Texts live in catalogs,
// one per language, with the same keys:
//
//   { "map": { "search": "Rechercher", "results_one": "{count} résultat",
//              "results_other": "{count} résultats" } }
//
// A text is read by its dotted key: t("map.search"). `{name}` is replaced by
// a value: t("signs.hello", { name }). A counted text has one entry per plural
// form of its language (`_one`, `_other`, and `_zero`, `_two`, `_few`, `_many`
// where a language needs them) and is read without the suffix, the form being
// chosen from `count`: t("map.results", { count }).

export type Catalog = { readonly [key: string]: string | Catalog }

type PluralForm = "zero" | "one" | "two" | "few" | "many" | "other"

type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Paths<T[K], `${Prefix}${K}.`>
}[keyof T & string]

type WithoutForm<K extends string> = K extends `${infer Base}_${PluralForm}`
  ? Base
  : K

// The keys of a catalog, plural entries under their common name.
export type MessageKey<C> = WithoutForm<Paths<C>>

export type Values = Record<string, string | number>

export type Translate<C> = (key: MessageKey<C>, values?: Values) => string

function flatten(
  catalog: Catalog,
  prefix = "",
  into = new Map<string, string>()
) {
  for (const [name, value] of Object.entries(catalog)) {
    if (typeof value === "string") {
      into.set(prefix + name, value)
    } else {
      flatten(value, `${prefix}${name}.`, into)
    }
  }

  return into
}

// Catalogs are flattened once, however many translators read them.
const flattened = new WeakMap<Catalog, Map<string, string>>()
function textsOf(catalog: Catalog) {
  let texts = flattened.get(catalog)
  if (!texts) {
    texts = flatten(catalog)
    flattened.set(catalog, texts)
  }

  return texts
}

// The translator of one language. `locale` (a BCP 47 tag) picks the plural
// rules. A key missing from `catalog` is read from `fallback`; missing there
// too, the key itself is shown, which makes it easy to spot.
export function createTranslator<C extends Catalog>(
  catalog: Catalog,
  fallback: C,
  locale: string
): Translate<C> {
  const sources = [textsOf(catalog), textsOf(fallback)]
  const rules =
    typeof Intl !== "undefined" && "PluralRules" in Intl
      ? new Intl.PluralRules(locale)
      : null

  return (key, values) => {
    const count = values?.count
    const names =
      typeof count === "number"
        ? [
            `${key}_${rules ? rules.select(count) : count === 1 ? "one" : "other"}`,
            `${key}_other`,
            key,
          ]
        : [key]
    let text: string | undefined
    for (const source of sources) {
      for (const name of names) {
        text ??= source.get(name)
      }
    }
    text ??= key

    return values
      ? text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""))
      : text
  }
}
