# WebMCP Chat

A Bun workspace monorepo. `apps/web` is the floating chat widget. `apps/demo` is a host page that registers WebMCP tools and embeds the widget. `apps/api` streams OpenRouter replies through TanStack AI.

## Stack

- Bun workspaces for package management
- Vite+ for the frontend toolchain and workspace commands
- React and TypeScript in `apps/web` and `apps/demo`
- Tailwind CSS 4 and shadcn/ui in the widget (`apps/web`)
- Hono on Bun in `apps/api`
- TanStack AI Chat UI in the widget, OpenRouter adapter in `apps/api`

Vite+ needs Node.js 22.18 or newer for its local CLI. Bun runs the API and manages workspace packages.

## Start the apps

Copy `.env.example` to `.env` at the repository root and set `OPENROUTER_API_KEY`. Optionally set `OPENROUTER_MODEL` (default `openai/gpt-5.5`).

The API also loads `apps/api/.env`. Bun loads `.env` from the API working directory (`apps/api`) automatically, so a copy there works too. If both files exist, already-set values (including `apps/api/.env`) win over the repository-root file.

Install from the repository root, then start the API, widget, and demo:

```sh
bun install
bun run dev
```

Open the demo at <http://localhost:5174>. It is a bike-shop job board (Desk, Done, Shop) that registers create, update, delete, and navigation tools, then loads `<webmcp-chat>` from <http://localhost:5173/widget.js>.

The widget origin is <http://localhost:5173> (iframe inner document). It proxies `/api` to the Hono app. The API health route is <http://localhost:3001/health>. Chat POSTs go to `/api/chat`.

Embed the widget on a host page:

```html
<script type="module" src="http://localhost:5173/widget.js"></script>
<webmcp-chat></webmcp-chat>
```

`<webmcp-chat>` mounts an iframe of the widget origin. Register page tools with `exposedTo: [widgetOrigin]` so the iframe is allowed to see them. The host still owns `document.modelContext`.

Build all workspaces with:

```sh
bun run build
```

Check TypeScript across apps with:

```sh
bun run typecheck
```

Run one app directly with `cd apps/web && bun run dev`, `cd apps/demo && bun run dev`, or `cd apps/api && bun run dev`.

## Add shadcn components

Run the shadcn CLI from `apps/web`. For example:

```sh
bunx --bun shadcn@latest add card
```

Components live in `apps/web/src/components/ui` and use the `@/` import alias.
