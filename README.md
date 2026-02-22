# ai-search-api

A Bun HTTP server that answers questions using AI (via the Vercel AI SDK) with tool access from the [Svelte MCP server](https://mcp.svelte.dev).

## Setup

```bash
bun install
```

## Run

```bash
bun index.ts
```

## Endpoints

- `GET /_health` — health check
- `GET /q` — ask a question using AI + Svelte MCP tools
