import { createChat } from "@shadcn/helpers/tanstack-ai";
import type { UIMessage } from "@tanstack/ai-client";
import {
  PAGE_CONTEXT,
  SUGGESTED_PROMPT,
  chatTools,
} from "@/lib/page-tool";

export { PAGE_CONTEXT, SUGGESTED_PROMPT };

export function getMessageText(message: UIMessage): string {
  return message.parts
    .flatMap((part) => (part.type === "text" ? [part.content] : []))
    .join("");
}

const LONG_REASONING = [
  "The user asked what I can do on this page, not what the app is in general.",
  "That means I should not invent host actions. I need the tools this page actually registered.",
  "WebMCP tools can appear and disappear as the host updates, so a stale list would be misleading.",
  "getPageContext is the safe first call: title, URL, and the current tool list.",
  "If the host only exposes that one tool, I should say so plainly instead of promising clicks, forms, or navigation I cannot perform.",
  "After the tool returns I will summarize the page identity, list each registered tool, and stop there.",
  "If the payload is empty or errors, I will say I could not read the page rather than guess.",
  "I am not going to browse the DOM myself. The contract is the page tools, so I will wait for getPageContext before answering.",
].join(" ");

export const demoChat = createChat<typeof chatTools>()
  .user(SUGGESTED_PROMPT)
  .assistant(({ writer }) => {
    writer.reasoning(LONG_REASONING, { delayMs: 18 });
    writer.sleep(200);
    writer
      .tool("getPageContext", {
        input: {},
      })
      .sleep(700)
      .output(PAGE_CONTEXT);
    writer.sleep(250);
    writer.text(
      "This host only exposes **getPageContext**. I can read:\n\n- the page title\n- the URL\n- the tools it registered\n\nRight now the page is untitled, at `https://localhost/`, with that single tool.",
    );
  });

export const demoInitialMessages = demoChat.get(0);

export const demoConnection = demoChat.transport({
  fallback:
    "This mock scripts one page-tool turn. Ask **What can you do on this page?** to see `getPageContext`, or start a new chat.",
});

export function sendChatTurn(
  chat: {
    messages: UIMessage[];
    isLoading: boolean;
    append: (message: UIMessage) => Promise<void>;
    sendMessage: (text: string) => Promise<void>;
  },
  text: string,
) {
  const trimmed = text.trim();
  if (!trimmed || chat.isLoading) {
    return;
  }

  const nextMessage = demoChat.next(chat.messages);
  if (nextMessage && getMessageText(nextMessage) === trimmed) {
    void chat.append(nextMessage);
    return;
  }

  void chat.sendMessage(trimmed);
}
