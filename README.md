# ai-search-api

A Bun HTTP server that answers questions using AI with tool access from the [Svelte MCP server](https://mcp.svelte.dev). Uses the [Vercel AI SDK](https://ai-sdk.dev/) with [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) for model routing.

## TODO

- [ ] Fine tune the prompts
- [ ] Deploy on Vercel https://bun.com/docs/guides/deployment/vercel

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

# API

## `POST /q`

Ask a question using AI with access to the [Svelte MCP server](https://mcp.svelte.dev) tools. The model always queries the MCP tools before answering — it never responds from memory alone.

**Request headers:**

| Header         | Required | Description                                      |
| -------------- | -------- | ------------------------------------------------ |
| `x-secret-key` | Yes      | Must match the `SECRET_KEY` environment variable |
| `Content-Type` | Yes      | Must be `application/json`                       |

**Request body:**

```json
{
  "question": "How do I use Svelte stores?"
}
```

| Field      | Type   | Description            |
| ---------- | ------ | ---------------------- |
| `question` | string | The question to answer |

**Response (200):**

```json
{
  "text": "...",
  "steps": 3
}
```

| Field   | Type   | Description                            |
| ------- | ------ | -------------------------------------- |
| `text`  | string | The AI-generated answer                |
| `steps` | number | Number of agentic steps taken (max 10) |

**Error responses:**

| Status | Description                                |
| ------ | ------------------------------------------ |
| `400`  | Missing or invalid `question` field        |
| `401`  | Missing or incorrect `x-secret-key` header |

**Example:**

```bash
curl -X POST http://localhost:3000/q \
  -H "Content-Type: application/json" \
  -H "x-secret-key: change-me" \
  -d '{"question": "How do I use Svelte stores?"}'
```
