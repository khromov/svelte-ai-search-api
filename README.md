# ai-search-api

A Bun HTTP server that answers questions using AI with tool access from the [Svelte MCP server](https://mcp.svelte.dev). Uses the [Vercel AI SDK](https://ai-sdk.dev/) with [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) for model routing.

## Setup

**1. Install Bun** (pins the version from `.bunversion`):

```bash
./install-bun.sh
```

**2. Configure environment:**

```bash
cp .env.sample .env
```

Edit `.env` and set a `SECRET_KEY` value.

**3. Install dependencies:**

```bash
bun install
```

**4. Authenticate with Vercel** (first time only):

```bash
bun run vercel:login
```

**5. Link to a Vercel project** (first time only):

```bash
bun run vercel:link
```

## Run

```bash
bun run start
```

This pulls the latest Vercel env vars and starts the server with hot reload.

## AI Gateway

Model calls are routed through [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) using `gateway.languageModel()` from the Vercel AI SDK. The gateway credentials are pulled automatically from Vercel environment variables via `bun run start` (which runs `vercel env pull` before starting the server).

## Endpoints

- `GET /_health` — health check
- `POST /q` — ask a question using AI + Svelte MCP tools; requires `x-secret-key` header and JSON body `{ "question": "..." }`
