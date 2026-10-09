import { useByok } from "@tanstack/ai-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  byok,
  closeKeySheet,
  getOpenRouterServerKey,
  isKeySheetOpen,
  openKeySheet,
  openRouterLocked,
  openRouterMasked,
  openRouterStatus,
  subscribeKeySheet,
  subscribeOpenRouterServerKey,
  openrouterByok,
} from "@/lib/byok";

function explainError(caught: unknown) {
  return caught instanceof Error ? caught.message : "Could not save key";
}

export function useOpenRouterServerKey() {
  return useSyncExternalStore(
    subscribeOpenRouterServerKey,
    getOpenRouterServerKey,
    () => false,
  );
}

export function useKeySheetOpen() {
  return useSyncExternalStore(subscribeKeySheet, isKeySheetOpen, () => false);
}

export function useOpenRouterKeyGate() {
  const snapshot = useByok(byok);
  const serverKey = useOpenRouterServerKey();
  const sheetOpen = useKeySheetOpen();
  const [hydrated, setHydrated] = useState(false);
  const status = openRouterStatus(snapshot);
  const masked = openRouterMasked(status);
  const locked = openRouterLocked(snapshot, status);
  const browserKey = status?.state === "set";
  const rejected = snapshot.prompt?.reason === "missing";
  const missing = !browserKey && !serverKey && !locked;
  const showSheet = hydrated && (locked || missing || rejected || sheetOpen);

  useEffect(() => {
    void byok.ready().then(() => setHydrated(true));
  }, []);

  return {
    snapshot,
    status,
    masked,
    locked,
    browserKey,
    serverKey,
    rejected,
    missing,
    showSheet,
    canSend: hydrated && (browserKey || serverKey) && !locked,
  };
}

export function OpenRouterKeyChip() {
  const { masked, serverKey, locked, browserKey } = useOpenRouterKeyGate();
  const label = locked
    ? "locked"
    : masked
      ? masked
      : serverKey && !browserKey
        ? "server"
        : null;

  if (!label) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      className="max-w-28 truncate font-mono text-[11px]"
      onClick={() => openKeySheet()}
    >
      {label}
    </Button>
  );
}

export function OpenRouterKeySheet({ onSaved }: { onSaved?: () => void }) {
  const snapshot = useByok(byok);
  const status = openRouterStatus(snapshot);
  const masked = openRouterMasked(status);
  const locked = openRouterLocked(snapshot, status);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const missingKey = snapshot.prompt?.reason === "missing";
  const storageMessage =
    snapshot.storageError ??
    (status?.state === "error" ? status.message : null);

  useEffect(() => {
    if (!missingKey) {
      setError(storageMessage ?? "");
    }
  }, [missingKey, storageMessage]);

  function finishSave() {
    setDraft("");
    setError("");
    closeKeySheet();
    onSaved?.();
  }

  if (locked) {
    return (
      <div className="rounded-lg border bg-popover p-3 text-popover-foreground">
        <h3 className="text-sm font-semibold">Unlock your key</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          A passkey in this browser already holds {masked ?? "your OpenRouter key"}.
          Confirm it to chat. The page still cannot read it.
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setError("");
              void byok
                .unlock()
                .then(() => {
                  closeKeySheet();
                })
                .catch((caught: unknown) => setError(explainError(caught)));
            }}
          >
            Unlock
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setError("");
              void byok
                .clear(openrouterByok.id)
                .catch((caught: unknown) => setError(explainError(caught)));
            }}
          >
            Use a different key
          </Button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const saveLabel = missingKey ? "Replace key" : "Save key";

  return (
    <form
      className="rounded-lg border bg-popover p-3 text-popover-foreground"
      onSubmit={(event) => {
        event.preventDefault();
        const next = draft.trim();
        if (!next) {
          return;
        }
        setError("");
        void byok
          .update(openrouterByok.id, next)
          .then(() => finishSave())
          .catch((caught: unknown) => {
            setError(explainError(caught));
          });
      }}
    >
      <h3 className="text-sm font-semibold">
        {missingKey ? "OpenRouter rejected the key" : "Add an OpenRouter key"}
      </h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {missingKey
          ? "Replace it, then send again. The draft stays in the composer."
          : "Used only to talk to the model. It stays in this browser. The page that embedded the chat never sees it."}
      </p>
      <Input
        type="password"
        autoComplete="off"
        value={draft}
        placeholder={masked ? `Saved ${masked}` : "sk-or-v1-…"}
        aria-label="OpenRouter API key"
        className="mt-3 font-mono"
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="mt-2.5 flex flex-col gap-1.5">
        <Button type="submit" size="sm" disabled={!draft.trim()}>
          {saveLabel}
        </Button>
        {masked ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setError("");
              void byok
                .clear(openrouterByok.id)
                .then(() => {
                  setDraft("");
                })
                .catch((caught: unknown) => setError(explainError(caught)));
            }}
          >
            Clear key
          </Button>
        ) : null}
      </div>
      {missingKey ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Paste an OpenRouter key, then send again.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
