import { afterEach, expect, test } from "bun:test";

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { search: "", origin: "http://localhost:5173" },
});

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem(key: string) {
      return memory.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      memory.set(key, value);
    },
    removeItem(key: string) {
      memory.delete(key);
    },
    clear() {
      memory.clear();
    },
  },
});

const { createConversationId } = await import("./chat-persistence.ts");

afterEach(() => {
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    writable: true,
    value: Crypto.prototype.randomUUID,
  });
  localStorage.clear();
});

test("createConversationId works when crypto.randomUUID is missing", () => {
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    writable: true,
    value: undefined,
  });
  expect(createConversationId().length).toBeGreaterThan(0);
});
