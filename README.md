# Mise

Mise is a small recipe discovery app built with Vue. It uses the [DummyJSON Recipes API](https://dummyjson.com/docs/recipes) for search, filters, sorting, recipe details, and related recipes. Favorites are saved in the browser. The interface is available in English, German, and French.

## Features

- Explore recipes with search, meal and tag filters, sorting, and pagination.
- Read recipe details, check off ingredients, and follow related recipes.
- Save favorites locally and revisit them on the Saved page.
- Switch the interface between English, German, and French.
- See loading, empty, and retry states when requests are pending or fail.

## Stack

Vue 3, TypeScript, Vite, Vue Router, SCSS, Paraglide JS, Lucide Vue, and DummyJSON. Vitest with Vue Test Utils covers unit and component behavior; Cypress covers browser journeys. GitHub Actions runs the checks.

## Getting started

Use Node.js `24.12+` (or `22.18+`) and pnpm `11.25.0`.

```bash
pnpm install
pnpm dev
```

Vite prints the local URL. No API key or backend setup is required.

## Available scripts

| Command          | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `pnpm dev`       | Start the development server.                            |
| `pnpm lint`      | Run ESLint.                                              |
| `pnpm typecheck` | Compile Paraglide messages and check TypeScript.         |
| `pnpm test`      | Run Vitest unit and component tests.                     |
| `pnpm build`     | Typecheck and create the production build in `dist/`.    |
| `pnpm test:e2e`  | Start a local Vite server and run Cypress browser tests. |
| `pnpm preview`   | Preview a production build locally.                      |

## Architecture

| Path                           | Responsibility                                                            |
| ------------------------------ | ------------------------------------------------------------------------- |
| `src/views/`                   | Coordinate page state and requests for Explore, Recipe Detail, and Saved. |
| `src/components/`              | Render reusable recipe and navigation UI.                                 |
| `src/services/`                | Make typed HTTP requests to DummyJSON with native `fetch`.                |
| `src/composables/`             | Share the small favorites state across views.                             |
| `src/router/`                  | Map the three routes and update route metadata.                           |
| `src/types/`                   | Describe the recipe API contract.                                         |
| `src/styles/`                  | Hold SCSS tokens and page styles.                                         |
| `messages/`, `project.inlang/` | Define the Paraglide messages and locales.                                |

The main flow is **view → API service → DummyJSON → typed data → Vue state → components**. Favorites follow **UI → `useFavorites` → `localStorage`**.

## Technical decisions

- Vue 3 Composition API and TypeScript keep state and API contracts explicit in a small app. Vue Router handles the three meaningful pages.
- Native `fetch` with `AbortSignal` and a small HTTP error type is enough for this public API; Axios and a repository layer would add little here.
- Local view state and one shared favorites composable avoid a global store. Only favorite IDs are persisted in `localStorage` because there is no user account or backend.
- SCSS tokens support the editorial visual system without mixing styling frameworks.
- Paraglide compiles typed UI messages. English is the base locale; German and French are included. The selected locale persists locally. Routes and DummyJSON recipe content remain untranslated.
- The API payload is typed but not runtime validated with Zod. A larger or less predictable API would justify schema validation.
- Metadata and Recipe JSON-LD are updated in the client. This SPA does not offer the crawler coverage of SSR or prerendering.

## Testing

Vitest checks the API layer, discovery interactions, recipe detail, favorites, Saved, localization, and metadata without relying on live network requests. Cypress checks Explore, search and filters, detail navigation, favorite persistence, retry behavior, localization, sticky UI, and reduced motion in a browser. The E2E suite intercepts DummyJSON so CI does not depend on its availability.

Run the same checks locally as GitHub Actions with the scripts above. API data is still requested live when using the app normally.

## Accessibility

The interface uses semantic landmarks and controls, visible keyboard focus, named favorite buttons, localized accessibility labels, responsive touch targets, and reduced-motion styles. This is an accessibility-aware implementation, not a claim of formal WCAG certification.

## Internationalization

Paraglide provides `en` (base), `de`, and `fr` UI messages. The browser preference is used initially unless a saved preference exists. Recipe names, ingredients, instructions, tags, and cuisines come from DummyJSON and remain in the API's language. URLs are not locale-prefixed.

## AI-assisted development

AI assisted with implementation, solution exploration, code review, tests, UI polish, and documentation. Scope, architectural decisions, validation, and the final review remained human-reviewed.

## Possible improvements

- Add account-backed favorites if cross-device syncing becomes a requirement.
- Use SSR or prerendering for stronger search and social crawler support after a production domain is known.
- Add runtime API schema validation if the external contract becomes less predictable.
- Add localized recipe content if a reliable source of translations becomes available.
- Expand cross-browser and assistive-technology testing for a production release.

## Time spent

Approximately **3 hours** in total, including implementation, testing, and polish.
