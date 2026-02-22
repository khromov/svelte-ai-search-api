import { generateText, stepCountIs } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { gateway } from "ai";

const server = Bun.serve({
  routes: {
    "/_health": (req) => {
      return new Response("OK");
    },
    "/q": async (req) => {
      const question = "What is $state in Svelte?";
      const mcpClient = await createMCPClient({
        transport: {
          type: "http",
          url: "https://mcp.svelte.dev/mcp",
        },
      });

      const model = gateway.languageModel(
        "anthropic/claude-sonnet-4-5-20250929",
      );

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

      return Response.json({ text: result.text, steps: result.steps.length });
    },
  },
  idleTimeout: 255,
  // fallback for unmatched routes:
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);
