# Aura Seeker — web

Bun + Turborepo monorepo.

- `apps/web` — React web app (Vite, Tailwind v4).
- `apps/mobile` — React Native app (Expo, Expo Router). UI only for now, on demo data.
- `packages/ui` — `@workspace/ui`, the shared UI library: shadcn/ui components on Radix for the web, and their React Native counterparts under `src/native`.

```bash
bun install
bun run dev      # http://localhost:5173
bun run build
bun run typecheck
bun run lint
```

The mobile app runs separately:

```bash
bun run mobile              # Expo dev server (Expo Go, emulator, or `w` for web)
```

React is pinned to the version Expo requires (root `overrides`), so the web app and the mobile app share one copy.

## API

The web app reads the Aura Seeker API (`../api-rust`). The API sends no CORS headers, so the app calls it under `/api` on its own origin and Vite proxies that to `http://127.0.0.1:8080` in `dev` and `preview` (set `API_URL` to proxy elsewhere). To call an API directly instead, set `VITE_API_URL` at build time; that API must then allow the app's origin.

## CI and Docker image

`.github/workflows/ci.yml` runs on every push:

- **quality** — `bun run format:check`, `bun run lint`, `bun run typecheck` on the whole monorepo.
- **web-image** — builds `apps/web/Dockerfile`, checks the container serves the app, scans it with Trivy, and on the default branch and `v*` tags pushes it to `ghcr.io/<owner>/aura-seeker-web` with an SBOM, build provenance and a cosign signature.

`.github/workflows/mobile-release.yml` builds the Android app when a `v*` tag is pushed and attaches the APK to that tag's GitHub release (run by hand, it keeps the APK as a workflow artifact instead). The version comes from the tag and the version code from the run number.

```bash
git tag v1.0.0 && git push origin v1.0.0
```

The APK is signed with Android's public debug key unless these repository secrets are set: `ANDROID_KEYSTORE_BASE64` (the keystore, base64-encoded), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. The repository variables `API_URL` and `CONTACT_EMAIL` are compiled into the app when set.

```bash
docker build -f apps/web/Dockerfile -t aura-seeker-web .
docker run -p 8080:8080 -e API_URL=https://api.example.org aura-seeker-web   # /api proxied
```

The image is unprivileged nginx on port 8080. It falls back to `index.html` for client-side routes and caches the hashed files under `/assets` for a year.

The API address is compiled into the app by the `VITE_API_URL` build argument:

- **In CI** it is `https://api.aura-seeker.matheo-galuba.com` (override with a repository variable named `API_URL`). The browser calls that API directly, so the API must allow the web app's origin (CORS).
- **Without the argument** it is `/api`: the app calls its own origin and nginx proxies that to `API_URL` at run time (default `http://api:8080`, no trailing slash). No CORS needed.

## Translations

Both apps read their texts from catalogs, one JSON file per language, through the same small runtime (`packages/ui/src/lib/i18n.ts`).

- `apps/web/src/lib/i18n/` and `apps/mobile/src/lib/i18n/` each hold `fr.json`, `en.json` and an `index.ts` listing the languages.
- A text is read by its key: `t("map.search")`, with values `t("signs.hello", { name })`. Keys are grouped by screen (`map.*`, `profile.*`…), with `common.*` for texts used in several places and `errors.*` for error messages.
- A counted text has one entry per plural form (`signCount_one`, `signCount_other`) and is read without the suffix: `t("common.signCount", { count })`.
- French is the reference: its catalog defines the keys, so `t("a.typo")` is a type error, and so is a catalog missing a key.

To add a language, copy `fr.json`, translate it, and add one entry to `languages` in that app's `index.ts`. It then appears in the language menu (web header, mobile settings).

## UI library rules

Every small component (text, buttons, inputs, form fields, …) lives in `packages/ui`. Apps only compose them.

```tsx
import { Button } from "@workspace/ui/components/button"
import { Text } from "@workspace/ui/components/text"
```

- **Components are stock shadcn.** Add new ones with the CLI, don't hand-write them:

  ```bash
  bunx --bun shadcn@latest add <component> -c packages/ui
  ```

  `text.tsx` is the one exception: shadcn has no text component, so it wraps shadcn's typography recipes.

- **Styling follows `aura-design.md` and lives in `packages/ui/src/styles/globals.css`.** It holds the brand palette (`--aura-*`, also available as `bg-aura-blue`, `text-aura-magenta`, …), the shadcn tokens mapped onto it for light and dark, and the type scale (`type-display`, `type-h1`, … used by `Text`). Change the look there first; touch a component's classes only when a token can't express it (button and input sizes, pill shape, focus ring).

- **Blue and slate bands use `surface-blue` / `surface-slate`.** These classes remap the tokens, so components inside switch to their reversed style (white primary button, white borders, links and focus ring) without extra props.

- **Light/dark mode** comes from the library: wrap the app in `ThemeProvider` (`components/theme-provider`) and drop in `ModeToggle` (`components/mode-toggle`). The choice (light, dark or system) is stored in `localStorage` and applied as a `.dark` class on `<html>`.

- **Graphik is not bundled** (licence to confirm). The font stack falls back to Arial; add the `@font-face` rules in `globals.css` once the WOFF2 files are available.

- **Apps don't import `radix-ui` or style raw text/controls themselves.** Keeping the library as the only entry point is what lets the React Native app reuse the same component names and props.

## React Native

shadcn components render DOM elements, so they cannot run in React Native. The mobile app uses the components in `packages/ui/src/native` instead (`Text`, `Button`, `IconButton`, `Badge`, `Chip`, `Input`, `Field`, `Checkbox`), imported as `@workspace/ui/native/<name>`. They keep the web components' names and variants where both exist, and take their colours and sizes from `native/tokens.ts`, which mirrors `globals.css`: change a token in both files.

Icons are passed in by the app (`lucide-react-native`), so the library itself only depends on `react-native`. Logo shapes shared by both platforms are in `packages/ui/src/lib/logo-glyphs.ts`.
