# WebMCP Chat

A Bun workspace monorepo with a React/Vite web app and a Hono API. The web app is a starter shell, and the API currently exposes only a health route.

## Stack

- Bun workspaces for package management
- Vite+ for the frontend toolchain and workspace commands
- React and TypeScript in `apps/web`
- Tailwind CSS 4 and shadcn/ui in `apps/web`
- Hono on Bun in `apps/api`
- TanStack AI Chat UI (`createChatHook`) plus the shadcn helper drive a mock floating chat widget in `apps/web`

Vite+ needs Node.js 22.18 or newer for its local CLI. Bun runs the API and manages workspace packages.

## Start the apps

Install from the repository root, then start both apps:

```sh
bun install
bun run dev
```

The web app runs at <http://localhost:5173>. The API runs at <http://localhost:3001/health> and returns `{"status":"ok"}`.

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
