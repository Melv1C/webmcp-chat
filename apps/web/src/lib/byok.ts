import { openrouterByok } from "@tanstack/ai-openrouter/byok";
import {
  defineByok,
  defaultByokStorage,
  type ByokSnapshot,
  type Keyring,
  type KeyringStorage,
  type KeyStatus,
} from "@tanstack/ai-react/byok";

export { openrouterByok };

function sessionMemoryStorage(): KeyringStorage {
  let keys: Keyring = {};
  return {
    id: "memory",
    label: "Session only (not saved)",
    persistent: false,
    warning:
      "Keys stay in this tab only. They are not saved across reloads.",
    load: () => ({ ...keys }),
    save: (next) => {
      keys = { ...next };
    },
    clear: () => {
      keys = {};
    },
  };
}

function isUserCancel(error: unknown) {
  if (
    typeof DOMException !== "undefined" &&
    error instanceof DOMException &&
    error.name === "NotAllowedError"
  ) {
    return true;
  }
  if (error instanceof Error && error.name === "NotAllowedError") {
    return true;
  }
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("cancelled") || message.includes("not allowed");
}

function isPasskeyUnavailable(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error);
  return (
    /resident credentials/i.test(message) ||
    /allowcredentials/i.test(message) ||
    /prf/i.test(message) ||
    /not supported/i.test(message)
  );
}

function passkeyThenSessionStorage(): KeyringStorage {
  const passkey = defaultByokStorage({ rpName: "WebMCP Chat" });
  const session = sessionMemoryStorage();
  let active: KeyringStorage = passkey;
  return {
    get id() {
      return active.id;
    },
    get label() {
      return active.label;
    },
    get persistent() {
      return active.persistent;
    },
    get unlockable() {
      return active.unlockable;
    },
    get warning() {
      return active.warning;
    },
    peek: () => active.peek?.() ?? {},
    load: () => active.load(),
    save: async (keys) => {
      try {
        await active.save(keys);
      } catch (error) {
        if (active === session || isUserCancel(error) || !isPasskeyUnavailable(error)) {
          throw error;
        }
        active = session;
        await active.save(keys);
      }
    },
    clear: () => active.clear(),
  };
}

export const byok = defineByok({
  storage: passkeyThenSessionStorage(),
  providers: [openrouterByok],
});

const MINTED_KEY = "webmcp-chat:openrouter-minted";

type Listener = () => void;

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let serverKey = false;
let sheetOpen = false;

export function getOpenRouterServerKey() {
  return serverKey;
}

export function subscribeOpenRouterServerKey(listener: Listener) {
  return subscribe(listener);
}

export function isKeySheetOpen() {
  return sheetOpen;
}

export function subscribeKeySheet(listener: Listener) {
  return subscribe(listener);
}

export function openKeySheet() {
  sheetOpen = true;
  emit();
}

export function closeKeySheet() {
  sheetOpen = false;
  emit();
}

export function stashMintedOpenRouterKey(key: string) {
  sessionStorage.setItem(MINTED_KEY, key);
  emit();
}

export function peekMintedOpenRouterKey() {
  return sessionStorage.getItem(MINTED_KEY);
}

export function takeMintedOpenRouterKey() {
  const value = sessionStorage.getItem(MINTED_KEY);
  sessionStorage.removeItem(MINTED_KEY);
  emit();
  return value;
}

export function openRouterStatus(
  snapshot: ByokSnapshot,
): KeyStatus | undefined {
  return snapshot.status[openrouterByok.id];
}

export function openRouterMasked(status: KeyStatus | undefined) {
  return status && "masked" in status ? status.masked : undefined;
}

export function openRouterLocked(
  snapshot: ByokSnapshot,
  status: KeyStatus | undefined,
) {
  return (
    snapshot.locked ||
    status?.state === "locked" ||
    snapshot.prompt?.reason === "locked"
  );
}

type HealthPayload = {
  openrouter?: {
    serverKey?: boolean;
  };
};

function isHealthPayload(value: unknown): value is HealthPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("openrouter" in value)) {
    return true;
  }
  const { openrouter } = value;
  if (openrouter === undefined) {
    return true;
  }
  if (typeof openrouter !== "object" || openrouter === null) {
    return false;
  }
  if (!("serverKey" in openrouter) || openrouter.serverKey === undefined) {
    return true;
  }
  return typeof openrouter.serverKey === "boolean";
}

void fetch("/api/health")
  .then(async (response) => {
    if (!response.ok) {
      return;
    }
    const payload: unknown = await response.json();
    if (!isHealthPayload(payload) || !payload.openrouter?.serverKey) {
      return;
    }
    serverKey = true;
    byok.setServerCoverage({ [openrouterByok.id]: true });
    emit();
  })
  .catch(() => {});
