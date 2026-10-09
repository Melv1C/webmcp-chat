import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  chat,
  chatParamsFromRequest,
  mergeAgentTools,
  toServerSentEventsResponse,
} from "@tanstack/ai";
import { byokMissing, getByokKey } from "@tanstack/ai/byok/server";
import { createOpenRouterText } from "@tanstack/ai-openrouter";
import { openrouterByok } from "@tanstack/ai-openrouter/byok";
import { Hono } from "hono";

const workspaceEnv = resolve(import.meta.dir, "../../.env");
if (existsSync(workspaceEnv)) {
  process.loadEnvFile(workspaceEnv);
}

const SYSTEM_PROMPT =
  "You work on the current host page. Use the tools provided for that page. Do not invent clicks, forms, navigation, or tools that are not listed. If no tools are available, say so.";

const DEFAULT_MODEL = "openai/gpt-5.5";
type OpenRouterModel = Parameters<typeof createOpenRouterText>[0];

const app = new Hono();

app.get("/health", (context) => {
  return context.json({ status: "ok" });
});

app.post("/api/chat", async (context) => {
  let params: Awaited<ReturnType<typeof chatParamsFromRequest>>;
  try {
    params = await chatParamsFromRequest(context.req.raw);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    throw error;
  }

  const apiKey = getByokKey(context.req.raw, openrouterByok);
  if (!apiKey) {
    return byokMissing(openrouterByok);
  }

  const model = (Bun.env.OPENROUTER_MODEL?.trim() ||
    DEFAULT_MODEL) as OpenRouterModel;
  const stream = chat({
    adapter: createOpenRouterText(model, apiKey),
    messages: params.messages,
    threadId: params.threadId,
    runId: params.runId,
    ...(params.parentRunId ? { parentRunId: params.parentRunId } : {}),
    ...(params.resume ? { resume: params.resume } : {}),
    tools: mergeAgentTools([], params.tools),
    systemPrompts: [SYSTEM_PROMPT],
  });

  return toServerSentEventsResponse(stream);
});

export default {
  port: Number(Bun.env.PORT ?? 3001),
  fetch: app.fetch,
};
