import { generateText, stepCountIs } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { gateway } from "ai";

const SYSTEM_PROMPT = `System instructions: 
  You are a Discord bot that answers questions about Svelte development in the official Svelte Discord server. You have access to the official Svelte documentation and can use it to answer questions.

  1. You MUST use the available MCP tools (get-documentation) to look up documentation. 
  2. If you are asked to or need to write code to answer a question, you SHOULD run the svelte-autofixer tool on the code to iterate on it until you get a well-working version with only minor warnings. 
  3. Never answer from memory alone — always call the relevant tools first. You MUST NEVER answer questions, even simple ones, without first calling the relevant tools to get up-to-date information.
  4. If you don't know the answer to a question, you should say you don't know, rather than making something up.
  5. NEVER answer without calling the get-documentation tool.
  6. At the end of messages, leave a list of documentation resources you used to answer the question.
  7. Respond with messages in Discord Markdown format, using code blocks for code snippets and formatting text as appropriate for Discord.`;

// Set to null to allow all tools, or an array of tool names to whitelist
const ALLOWED_TOOLS = [
  "get-documentation",
  "list-sections",
  "svelte-autofixer",
];

const MCP_URL = "https://mcp.svelte.dev/mcp";

function createClient() {
  return createMCPClient({ transport: { type: "http", url: MCP_URL } });
}

async function handleQuestion(question: string) {
  const mcpClient = await createClient();

  try {
    const promptResult = await mcpClient.experimental_getPrompt({
      name: "svelte-task",
      arguments: { task: question },
    });

    const messages = promptResult.messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content.type === "text" ? msg.content.text : "",
    }));

    console.log(`[prompt] messages=${messages.length}`);
    for (const msg of messages) {
      console.log(`[prompt:${msg.role}]\n`, msg.content);
    }

    const model = gateway.languageModel("anthropic/claude-sonnet-4-6");

    const allTools = await mcpClient.tools();
    const tools = ALLOWED_TOOLS
      ? Object.fromEntries(
          Object.entries(allTools).filter(([name]) =>
            ALLOWED_TOOLS.includes(name),
          ),
        )
      : allTools;

    const result = await generateText({
      model,
      tools,
      stopWhen: stepCountIs(10),
      system: SYSTEM_PROMPT,
      messages,
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
  } finally {
    await mcpClient.close();
  }
}

async function listPrompts() {
  const mcpClient = await createClient();
  try {
    const prompts = await mcpClient.experimental_listPrompts();
    return prompts;
  } finally {
    await mcpClient.close();
  }
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
        const secretKey = process.env.SECRET_KEY;
        const providedKey = req.headers.get("x-secret-key");
        console.log(
          `[auth] SECRET_KEY set=${!!secretKey} provided=${!!providedKey} match=${providedKey === secretKey}`,
        );
        if (!secretKey || providedKey !== secretKey) {
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
  },
  idleTimeout: 255,
  // fallback for unmatched routes:
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);
