import { generateText, stepCountIs } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { gateway } from "ai";

async function handleQuestion(question: string) {
  const mcpClient = await createMCPClient({
    transport: {
      type: "http",
      url: "https://mcp.svelte.dev/mcp",
    },
  });

  const model = gateway.languageModel("anthropic/claude-sonnet-4-6");

  const result = await generateText({
    model,
    tools: await mcpClient.tools(),
    stopWhen: stepCountIs(10),
    prompt: question,
    experimental_onStepStart: ({ stepNumber }) => {
      console.log(`[step:start] step=${stepNumber}`);
    },
    experimental_onToolCallStart: ({ toolCall }) => {
      console.log(`[tool:start] ${toolCall.toolName}\n`, toolCall.input);
    },
    onStepFinish: ({ stepNumber, text, toolResults, finishReason }) => {
      for (const result of toolResults) {
        const output = String(result.output ?? "").slice(0, 120);
        console.log(`[tool:result] ${result.toolName}\n`, output);
      }
      if (text) console.log(`[step:text]\n`, text);
      console.log(
        `[step:finish] step=${stepNumber} finishReason=${finishReason} toolResults=${toolResults.length}`,
      );
    },
    onFinish: ({ steps, finishReason, usage }) => {
      console.log(
        `[finish] finishReason=${finishReason} steps=${steps.length} tokens=${usage.totalTokens}`,
      );
    },
  });

  return { text: result.text, steps: result.steps.length };
}

const server = Bun.serve({
  routes: {
    "/_health": () => {
      return new Response("OK");
    },
    "/q": {
      GET: async () => {
        return new Response(
          "Send a POST request with a JSON body: { question: string } and header x-secret-key: <key>",
          { status: 405 },
        );
      },
      POST: async (req) => {
        const secretKey = process.env.SECRET_KEY;
        if (!secretKey || req.headers.get("x-secret-key") !== secretKey) {
          return new Response("Unauthorized", { status: 401 });
        }

        const body = (await req.json()) as Record<string, unknown>;
        const question = body.question;
        if (!question || typeof question !== "string") {
          return Response.json(
            { error: "Missing or invalid 'question' field" },
            { status: 400 },
          );
        }

        return Response.json(await handleQuestion(question));
      },
    },
    "/q-demo": {
      GET: () => new Response(Bun.file("./q-demo.html")),
      POST: async (req) => {
        const body = (await req.json()) as Record<string, unknown>;
        const question = body.question;
        if (!question || typeof question !== "string") {
          return Response.json(
            { error: "Missing or invalid 'question' field" },
            { status: 400 },
          );
        }

        return Response.json(await handleQuestion(question));
      },
    },
  },
  idleTimeout: 255,
  // fallback for unmatched routes:
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);
