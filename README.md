# ai-search-api

A Bun HTTP server that answers questions using AI (via the Vercel AI SDK) with tool access from the [Svelte MCP server](https://mcp.svelte.dev).

## Setup

**1. Install Bun** (pins the version from `.bunversion`):

```bash
./install-bun.sh
```

**2. Install dependencies:**

```bash
bun install
```

**3. Authenticate with Vercel** (first time only):

```bash
bun run vercel:login
```

**4. Link to a Vercel project** (first time only):

```bash
bun run vercel:link
```

## Run

```bash
bun run start
```

This pulls the latest Vercel env vars and starts the server with hot reload.

## Endpoints

- `GET /_health` — health check
- `GET /q` — ask a question using AI + Svelte MCP tools
