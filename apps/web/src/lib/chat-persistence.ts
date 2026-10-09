import { localStoragePersistence } from "@tanstack/ai-react";
import { hostOrigin } from "@/lib/host-origin";

const VERSION = "v1";
const originKey = encodeURIComponent(hostOrigin);

export const chatPersistence = localStoragePersistence({
  keyPrefix: `webmcp:${VERSION}:${originKey}:`,
});

function currentConversationKey() {
  return `webmcp:${VERSION}:current:${originKey}`;
}

export function readConversationId(): string {
  try {
    const existing = localStorage.getItem(currentConversationKey());
    if (existing) {
      return existing;
    }
  } catch {
    // Storage may be unavailable (private mode, quota, disabled).
  }

  return createConversationId();
}

export function createConversationId(): string {
  const id = crypto.randomUUID();

  try {
    localStorage.setItem(currentConversationKey(), id);
  } catch {
    // Chat still works in memory for this session.
  }

  return id;
}

export function startNewConversation(): string {
  return createConversationId();
}

export function discardConversation(threadId: string): void {
  try {
    void chatPersistence.removeItem(threadId);
  } catch {
    // Best-effort cleanup of an abandoned thread.
  }
}
