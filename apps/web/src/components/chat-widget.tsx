import { MessageSquareIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { AppChat, useAppChat } from "@/components/chat-ui";
import { PageToolsProvider, PageToolsToggle, usePageTools } from "@/components/page-tools";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  discardConversation,
  readConversationId,
  startNewConversation,
} from "@/lib/chat-persistence";
import { WEBMCP_CHAT_OPEN } from "@/lib/embed-protocol";
import { hostOrigin } from "@/lib/host-origin";

function ChatPanel({
  labelledBy,
  threadId,
  onClose,
  onNewChat,
}: {
  labelledBy: string;
  threadId: string;
  onClose: () => void;
  onNewChat: () => void;
}) {
  const { chat, pageTools } = useAppChat(threadId);

  return (
    <PageToolsProvider tools={pageTools}>
      <ChatPanelBody
        chat={chat}
        labelledBy={labelledBy}
        onClose={onClose}
        onNewChat={onNewChat}
      />
    </PageToolsProvider>
  );
}

function ChatPanelBody({
  chat,
  labelledBy,
  onClose,
  onNewChat,
}: {
  chat: ReturnType<typeof useAppChat>["chat"];
  labelledBy: string;
  onClose: () => void;
  onNewChat: () => void;
}) {
  const pageTools = usePageTools();

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onKeyDown={(event) => {
        if (event.key === "Escape" && pageTools?.listOpen) {
          event.preventDefault();
          event.stopPropagation();
          pageTools.setListOpen(false);
        }
      }}
    >
      <header className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
        <h2
          id={labelledBy}
          className="flex-1 truncate px-1.5 text-sm font-medium"
        >
          WebMCP Chat
        </h2>
        <PageToolsToggle />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="New chat"
                onClick={onNewChat}
              />
            }
          >
            <PlusIcon />
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            New chat
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close chat"
                onClick={onClose}
              />
            }
          >
            <XIcon />
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            Close
          </TooltipContent>
        </Tooltip>
      </header>
      <AppChat chat={chat} />
    </div>
  );
}

export function ChatWidget() {
  const titleId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(readConversationId);
  const discardedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (window.parent === window) {
      return;
    }

    window.parent.postMessage({ type: WEBMCP_CHAT_OPEN, open }, hostOrigin);
  }, [open]);

  useEffect(() => {
    const discardedId = discardedIdRef.current;
    if (discardedId == null) {
      return;
    }
    discardedIdRef.current = null;
    discardConversation(discardedId);
  }, [conversationId]);

  function close() {
    setOpen(false);
    queueMicrotask(() => launcherRef.current?.focus());
  }

  return (
    <TooltipProvider>
      {open ? (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
          }}
          className="flex h-full flex-col overflow-hidden rounded-xl border bg-background"
        >
          <ChatPanel
            key={conversationId}
            labelledBy={titleId}
            threadId={conversationId}
            onClose={close}
            onNewChat={() => {
              discardedIdRef.current = conversationId;
              setConversationId(startNewConversation());
            }}
          />
        </section>
      ) : (
        <Button
          ref={launcherRef}
          type="button"
          size="icon-lg"
          aria-label="Open chat"
          className="size-full rounded-lg"
          onClick={() => setOpen(true)}
        >
          <MessageSquareIcon />
        </Button>
      )}
    </TooltipProvider>
  );
}
