import { MessageSquareIcon, PlusIcon, XIcon } from "lucide-react";
import { useId, useRef, useState } from "react";
import { AppChat, useAppChat } from "@/components/chat-ui";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function ChatPanel({
  labelledBy,
  onClose,
  onNewChat,
}: {
  labelledBy: string;
  onClose: () => void;
  onNewChat: () => void;
}) {
  const chat = useAppChat();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
        <h2
          id={labelledBy}
          className="flex-1 truncate px-1.5 text-sm font-medium"
        >
          WebMCP Chat
        </h2>
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
          <TooltipContent>New chat</TooltipContent>
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
          <TooltipContent>Close</TooltipContent>
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
  const [session, setSession] = useState(0);

  function close() {
    setOpen(false);
    queueMicrotask(() => launcherRef.current?.focus());
  }

  return (
    <div data-slot="chat-widget">
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
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden border bg-background shadow-[0_12px_40px_-16px_rgb(0_0_0/0.4)]",
            "inset-3 rounded-xl sm:inset-auto sm:right-4 sm:bottom-4 sm:h-[min(36rem,calc(100dvh-2rem))] sm:w-96",
          )}
        >
          <ChatPanel
            key={session}
            labelledBy={titleId}
            onClose={close}
            onNewChat={() => setSession((current) => current + 1)}
          />
        </section>
      ) : (
        <Button
          ref={launcherRef}
          type="button"
          size="icon-lg"
          aria-label="Open chat"
          aria-expanded={false}
          className="fixed right-4 bottom-4 z-50 rounded-lg"
          onClick={() => setOpen(true)}
        >
          <MessageSquareIcon />
        </Button>
      )}
    </div>
  );
}
