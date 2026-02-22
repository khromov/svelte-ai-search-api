# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run start          # Pull Vercel env vars and start server with hot reload
bun run tsc            # Type-check (run before completing any task)
bun test               # Run tests
bun run vercel:login   # Authenticate with Vercel (first time)
bun run vercel:link    # Link to Vercel project (first time)
```

The `start` script runs `vercel env pull .env.local` before launching the server, so Vercel environment variables (including AI Gateway credentials) are always fresh.

## Architecture

Single-file HTTP server (`index.ts`) using `Bun.serve()` with the following routes:

- `GET /_health` — health check
- `POST /q` — authenticated AI question endpoint
- `GET /q-demo` — serves `q-demo.html` demo UI
- `POST /q-demo` — same as `/q` but with debug logging

**Request flow for `/q`:**
1. Validates `x-secret-key` header against `SECRET_KEY` env var
2. Creates an MCP client connected to `https://mcp.svelte.dev/mcp`
3. Fetches a `svelte-task` prompt from the MCP server using `experimental_getPrompt`
4. Calls `generateText` from the Vercel AI SDK with the MCP tools, routing through Vercel AI Gateway (`gateway.languageModel("anthropic/claude-sonnet-4-6")`)
5. Returns `{ text, steps }` — answer text and number of agentic steps taken (max 10)

**Key dependencies:**
- `ai` — Vercel AI SDK (`generateText`, `stepCountIs`, `gateway`)
- `@ai-sdk/mcp` — MCP client (`createMCPClient`)
- `vercel` — CLI used only for env management, not deployment runtime

**MCP tool allowlist** (`ALLOWED_TOOLS` in `index.ts`): `get-documentation`, `list-sections`, `svelte-autofixer`. Set to `null` to allow all tools.

## Environment

```bash
cp .env.sample .env
```

Required: `SECRET_KEY` — authenticates API requests via `x-secret-key` header.

Vercel AI Gateway credentials come from Vercel env vars (pulled via `vercel env pull` in the `start` script). The server uses `idleTimeout: 255` to accommodate slow AI responses.

## Bun conventions

- Use `bun <file>` not `node` or `ts-node`
- Use `Bun.serve()` not express
- Use `Bun.file()` not `node:fs`
- Bun auto-loads `.env` — don't use dotenv
- Run `bun run tsc` to catch type errors before finishing
