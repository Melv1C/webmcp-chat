import type { AnyClientTool, WebMCPPageTool } from "@tanstack/ai-client";
import {
  fetchServerSentEvents,
  useChat,
  usePageWebMCPTools,
} from "@tanstack/ai-react";
import { chatPersistence } from "@/lib/chat-persistence";
import {
  createChatUI,
  type LayoutProps,
  type MessageProps,
  type PartProps,
  type ToolProps,
} from "@tanstack/ai-react/ui";
import { streamingMarkdownExtension } from "@tanstack/markdown/extensions/streaming";
import {
  Markdown,
  type MarkdownComponentProps,
  type MarkdownComponents,
} from "@tanstack/markdown/react";
import { ArrowUpIcon, BrainIcon, ChevronDownIcon, WrenchIcon } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { PageToolsList, usePageTools } from "@/components/page-tools";
import { hostOrigin } from "@/lib/host-origin";

const SUGGESTED_PROMPT = "What can you do on this page?";

const chatOptions = {
  connection: fetchServerSentEvents("/api/chat"),
  persistence: chatPersistence,
  tools: [] as AnyClientTool[],
};

function isChatPageTool(tool: WebMCPPageTool) {
  return tool.origin === hostOrigin && !tool.name.includes(".");
}

const streamingExtensions = [streamingMarkdownExtension()];

const markdownComponents = {
  a({ href, children, ...props }: MarkdownComponentProps<"a">) {
    const external = /^https?:\/\//i.test(href ?? "");
    return (
      <a
        {...props}
        href={href}
        rel={external ? "nofollow noopener noreferrer" : props.rel}
        target={external ? "_blank" : props.target}
      >
        {children}
      </a>
    );
  },
} satisfies MarkdownComponents;

const MessageRoleContext = createContext<
  "user" | "assistant" | "system" | "activity"
>("assistant");

function isToolRunning(state: string) {
  return (
    state === "awaiting-input" ||
    state === "input-streaming" ||
    state === "input-complete"
  );
}

function ChatInput() {
  const chat = useChatContext();
  const pageTools = usePageTools();
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const pendingCaretRef = useRef<number | null>(null);
  const [input, setInput] = useState("");
  const canSend = input.trim().length > 0 && !chat.isLoading;
  const prefillNonce = pageTools?.prefill.nonce ?? 0;
  const prefillText = pageTools?.prefill.text ?? "";

  function rememberSelection(target: HTMLTextAreaElement) {
    selectionRef.current = {
      start: target.selectionStart,
      end: target.selectionEnd,
    };
  }

  useEffect(() => {
    if (prefillNonce === 0) {
      return;
    }
    const insert = prefillText;
    setInput((current) => {
      const start = Math.min(selectionRef.current.start, current.length);
      const end = Math.min(selectionRef.current.end, current.length);
      pendingCaretRef.current = start + insert.length;
      return current.slice(0, start) + insert + current.slice(end);
    });
  }, [prefillNonce, prefillText]);

  useLayoutEffect(() => {
    const caret = pendingCaretRef.current;
    if (caret == null) {
      return;
    }
    pendingCaretRef.current = null;
    const el = composerRef.current;
    if (!el) {
      return;
    }
    el.focus();
    el.setSelectionRange(caret, caret);
    selectionRef.current = { start: caret, end: caret };
  }, [input]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chat.isLoading) {
      return;
    }
    void chat.sendMessage(trimmed);
    setInput("");
    selectionRef.current = { start: 0, end: 0 };
  }

  return (
    <form
      className="shrink-0 border-t p-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit(input);
      }}
    >
      <InputGroup className="h-auto items-end">
        <InputGroupTextarea
          ref={composerRef}
          rows={1}
          value={input}
          placeholder="Ask about this page"
          aria-label="Message"
          autoFocus
          className="min-h-10 max-h-32 py-2.5 field-sizing-content"
          onChange={(event) => setInput(event.target.value)}
          onSelect={(event) => rememberSelection(event.currentTarget)}
          onBlur={(event) => rememberSelection(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit(input);
            }
          }}
        />
        <InputGroupAddon align="inline-end" className="pb-1.5">
          <InputGroupButton
            type="submit"
            size="icon-xs"
            variant="default"
            disabled={!canSend}
            aria-label="Send"
          >
            <ArrowUpIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

function ChatLayout({ Messages, Input }: LayoutProps<typeof chatOptions>) {
  const chat = useChatContext();
  const pageTools = usePageTools();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {pageTools?.listOpen ? (
        <PageToolsList />
      ) : (
        <MessageScrollerProvider defaultScrollPosition="last-anchor">
          <MessageScroller className="min-h-0 flex-1">
            <MessageScrollerViewport aria-label="Conversation">
              <MessageScrollerContent className="gap-3 px-3 py-3">
                {chat.messages.length === 0 ? (
                  <MessageScrollerItem>
                    <div className="flex flex-col items-start gap-3 pt-2">
                      <p className="text-sm text-muted-foreground">
                        Ask about this page.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={chat.isLoading}
                        onClick={() => void chat.sendMessage(SUGGESTED_PROMPT)}
                      >
                        {SUGGESTED_PROMPT}
                      </Button>
                    </div>
                  </MessageScrollerItem>
                ) : (
                  <Messages />
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      )}
      {chat.error ? (
        <p role="alert" className="px-3 pb-1 text-xs text-destructive">
          {chat.error.message}
        </p>
      ) : null}
      <Input />
    </div>
  );
}

function ChatMessageRow({ message, Parts }: MessageProps<typeof chatOptions>) {
  const isUser = message.role === "user";

  return (
    <MessageRoleContext.Provider value={message.role}>
      <MessageScrollerItem messageId={message.id} scrollAnchor={isUser}>
        <Message align={isUser ? "end" : "start"}>
          <MessageContent>
            {isUser ? (
              <Bubble variant="default" align="end">
                <BubbleContent>
                  <Parts />
                </BubbleContent>
              </Bubble>
            ) : (
              <Parts />
            )}
          </MessageContent>
        </Message>
      </MessageScrollerItem>
    </MessageRoleContext.Provider>
  );
}

function ChatText({ part }: PartProps<typeof chatOptions, "text">) {
  return <span className="whitespace-pre-wrap">{part.content}</span>;
}

function ChatMarkdown({ content }: { content: string }) {
  return (
    <div data-slot="chat-markdown">
      <Markdown
        extensions={streamingExtensions}
        frontmatter={false}
        headingIds={false}
        components={markdownComponents}
      >
        {content}
      </Markdown>
    </div>
  );
}

function AssistantText({ part }: PartProps<typeof chatOptions, "text">) {
  return (
    <Bubble variant="ghost">
      <BubbleContent className="border-0">
        <ChatMarkdown content={part.content} />
      </BubbleContent>
    </Bubble>
  );
}

function ChatThinking({ part }: PartProps<typeof chatOptions, "thinking">) {
  const chat = useChatContext();
  const lastPart = chat.messages.at(-1)?.parts.at(-1);
  const active = chat.isLoading && lastPart?.type === "thinking";
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(active);
  }, [active]);

  if (!active && !part.content) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full min-w-0">
      <CollapsibleTrigger className="group/tool flex w-full items-center gap-1.5 py-1 text-left text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        <BrainIcon className="size-3.5 shrink-0" />
        <span
          className={
            active
              ? "min-w-0 flex-1 truncate animate-pulse"
              : "min-w-0 flex-1 truncate"
          }
        >
          {active ? "Thinking…" : "Thought"}
        </span>
        <ChevronDownIcon className="size-3 shrink-0 transition-transform group-aria-expanded/tool:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-closed:overflow-hidden data-closed:animate-collapsible-up">
        <ScrollArea className="max-h-40 pb-1 [&_[data-slot=scroll-area-viewport]]:max-h-40 [&_[data-slot=scroll-area-viewport]]:h-auto">
          <p
            role={active ? "status" : undefined}
            className="pr-3 text-xs leading-5 whitespace-pre-wrap text-muted-foreground"
          >
            {part.content || "…"}
          </p>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ToolCall({ part, result }: ToolProps<typeof chatOptions>) {
  if (isToolRunning(part.state)) {
    return (
      <Marker role="status">
        <MarkerIcon>
          <WrenchIcon />
        </MarkerIcon>
        <MarkerContent className="shimmer">Calling {part.name}…</MarkerContent>
      </Marker>
    );
  }

  const payload =
    part.output ?? result?.content ?? part.input ?? part.arguments;
  const title = `${part.name}${part.state === "error" ? " failed" : ""}`;
  const detail =
    payload == null || payload === ""
      ? null
      : typeof payload === "string"
      ? payload
      : JSON.stringify(payload, null, 2);

  if (detail == null) {
    return (
      <div className="flex w-full min-w-0 items-center gap-1.5 py-1 text-xs font-medium text-muted-foreground">
        <WrenchIcon className="size-3.5" />
        {title}
      </div>
    );
  }

  return (
    <Collapsible className="w-full min-w-0">
      <CollapsibleTrigger className="group/tool flex w-full items-center gap-1.5 py-1 text-left text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        <WrenchIcon className="size-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <ChevronDownIcon className="size-3 shrink-0 transition-transform group-aria-expanded/tool:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-closed:overflow-hidden data-closed:animate-collapsible-up">
        <pre className="overflow-x-auto pb-1 font-sans text-xs leading-5 whitespace-pre-wrap text-muted-foreground">
          {detail}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ChatTextPart({ part }: PartProps<typeof chatOptions, "text">) {
  const role = useContext(MessageRoleContext);

  if (role === "user") {
    return <ChatText part={part} />;
  }

  return <AssistantText part={part} />;
}

function anyToolComponents(
  Component: ComponentType<ToolProps<typeof chatOptions>>
) {
  return new Proxy({} as Record<string, typeof Component>, {
    get(_target, key) {
      if (typeof key !== "string" || key === "then") {
        return undefined;
      }
      return Component;
    },
  });
}

const chatUI = createChatUI(chatOptions, {
  components: {
    input: ChatInput,
    layout: ChatLayout,
    message: ChatMessageRow,
  },
  partsComponents: {
    text: ChatTextPart,
    thinking: ChatThinking,
    fallback: () => null,
  },
  toolsComponents: anyToolComponents(ToolCall),
});

const useChatContext = chatUI.useChatContext;
export const AppChat = chatUI.Chat;

export function useAppChat(threadId: string) {
  const pageTools = usePageWebMCPTools({ filter: isChatPageTool });
  const chat = useChat({
    ...chatOptions,
    threadId,
    tools: pageTools,
  });
  return { chat, pageTools };
}
