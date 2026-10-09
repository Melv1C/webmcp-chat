import { localStoragePersistence } from "@tanstack/ai-react";

const VERSION = "v1";

export const chatPersistence = localStoragePersistence({
  keyPrefix: `webmcp:${VERSION}:`,
});

function currentConversationKey() {
  return `webmcp:${VERSION}:current`;
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
  const id =
    crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

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
