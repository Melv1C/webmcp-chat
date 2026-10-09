import { toolDefinition } from "@tanstack/ai";
import { getWebMCPTools } from "@tanstack/ai-client";
import { z } from "zod";

export const SUGGESTED_PROMPT = "What can you do on this page?";

export const getPageContextTool = toolDefinition({
  name: "getPageContext",
  description: "Read the current page title, URL, and available tools.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    title: z.string(),
    url: z.string(),
    tools: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    ),
  }),
}).client(async () => {
  const tools = await getWebMCPTools();
  return {
    title: document.title || "Untitled host page",
    url: location.href,
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    })),
  };
});

export const hostPageTools = [getPageContextTool];
