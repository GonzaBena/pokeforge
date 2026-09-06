## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Package Manager

Always use `pnpm` instead of `npm`, and `pnpx` instead of `npx`.
- `pnpm install`
- `pnpm run <script>` (e.g. `pnpm run check`, `pnpm run build`)
- `pnpx <command>`
## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Pokémon Type Colors & Design Tokens

Design tokens and type color variables are defined in [`src/styles/tokens.css`](file:///Users/gonzo/Documents/workspace/poketeam/src/styles/tokens.css) (e.g. `var(--type-fire)`, `var(--type-water)`).
Full reference guide: [`docs/GUIA_COLORES_TIPOS.md`](file:///Users/gonzo/Documents/workspace/poketeam/docs/GUIA_COLORES_TIPOS.md).

