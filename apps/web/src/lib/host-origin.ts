type ToolReader = {
  getTools: (options?: { fromOrigins?: string[] }) => Promise<unknown>;
};

function readHostOrigin() {
  try {
    const value = new URLSearchParams(location.search).get("hostOrigin");
    if (value) {
      return new URL(value).origin;
    }
  } catch {
    // Ignore an invalid hostOrigin query.
  }

  return location.origin;
}

export const hostOrigin = readHostOrigin();

export function allowHostOriginTools() {
  // TanStack calls getTools() with no fromOrigins. The polyfill then hides
  // cross-origin host tools unless this iframe document asks for the host.
  if (hostOrigin === location.origin) {
    return;
  }

  if (!("modelContext" in document) || document.modelContext == null) {
    return;
  }

  const context = document.modelContext as ToolReader;
  if (typeof context.getTools !== "function") {
    return;
  }

  const original = context.getTools.bind(context);
  context.getTools = (options = {}) => {
    const fromOrigins = [
      ...new Set([...(options.fromOrigins ?? []), hostOrigin]),
    ];
    return original({ ...options, fromOrigins });
  };
}
