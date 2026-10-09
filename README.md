# WebMCP Chat

A Bun workspace monorepo with a React/Vite web app and a Hono API. The web app is a floating chat widget. The API streams OpenRouter replies through TanStack AI.

## Stack

- Bun workspaces for package management
- Vite+ for the frontend toolchain and workspace commands
- React and TypeScript in `apps/web`
- Tailwind CSS 4 and shadcn/ui in `apps/web`
- Hono on Bun in `apps/api`
- TanStack AI Chat UI in `apps/web`, OpenRouter adapter in `apps/api`

Vite+ needs Node.js 22.18 or newer for its local CLI. Bun runs the API and manages workspace packages.

## Start the apps

Copy `.env.example` to `.env` at the repository root and set `OPENROUTER_API_KEY`. Optionally set `OPENROUTER_MODEL` (default `openai/gpt-5.5`).

The API also loads `apps/api/.env`. Bun loads `.env` from the API working directory (`apps/api`) automatically, so a copy there works too. If both files exist, already-set values (including `apps/api/.env`) win over the repository-root file.

Install from the repository root, then start both apps:

```sh
bun install
bun run dev
```

The web app runs at <http://localhost:5173> and proxies `/api` to the Hono app. The API health route is <http://localhost:3001/health>. Chat POSTs go to `/api/chat`.

Build both workspaces with:

```sh
bun run build
```

Check TypeScript across both apps with:

```sh
bun run typecheck
```

Run one app directly with `cd apps/web && bun run dev` or `cd apps/api && bun run dev`.

## Add shadcn components

Run the shadcn CLI from `apps/web`. For example:

```sh
bunx --bun shadcn@latest add card
```

Components live in `apps/web/src/components/ui` and use the `@/` import alias.
