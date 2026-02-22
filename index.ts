import { generateText } from "ai";
import { experimental_createMCPClient as createMCPClient } from "ai/mcp";
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

        const model = gateway.languageModel("anthropic/claude-sonnet-4-5-20250929");

        const result = await generateText({
            model,
            tools: await mcpClient.tools(),
            maxSteps: 10,
            prompt: question,
        });


        return new Response("OK");
    },
  },
  // fallback for unmatched routes:
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);
