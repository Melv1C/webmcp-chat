import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

export const SUGGESTED_PROMPT = "What can you do on this page?";

export const PAGE_CONTEXT = {
  title: "Untitled host page",
  url: "https://localhost/",
  tools: [
    {
      name: "getPageContext",
      description: "Read the current page title, URL, and available tools.",
    },
  ],
};

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
}).client();

export const chatTools = [getPageContextTool];
