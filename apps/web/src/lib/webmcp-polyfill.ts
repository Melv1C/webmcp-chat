type WebMcpTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  annotations?: object;
  execute: (
    input: object,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown>;
};

type PageTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  origin: string;
  annotations?: object;
};

class ModelContext extends EventTarget {
  #tools = new Map<string, WebMcpTool>();

  async registerTool(
    tool: WebMcpTool,
    options: { signal: AbortSignal },
  ): Promise<void> {
    if (options.signal.aborted) {
      throw new DOMException("Registration aborted.", "AbortError");
    }

    this.#tools.set(tool.name, tool);
    this.dispatchEvent(new Event("toolchange"));

    options.signal.addEventListener(
      "abort",
      () => {
        this.#tools.delete(tool.name);
        this.dispatchEvent(new Event("toolchange"));
      },
      { once: true },
    );
  }

  async getTools(): Promise<Array<PageTool>> {
    return [...this.#tools.values()].map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      origin: location.origin,
      annotations: tool.annotations,
    }));
  }

  async executeTool(
    tool: PageTool,
    input: unknown,
    options?: { signal?: AbortSignal },
  ): Promise<string> {
    const registered = this.#tools.get(tool.name);
    if (!registered) {
      throw new Error(`Unknown page tool "${tool.name}".`);
    }

    const result = await registered.execute((input ?? {}) as object, options);
    return typeof result === "string" ? result : JSON.stringify(result);
  }
}

Object.defineProperty(document, "modelContext", {
  configurable: true,
  value: new ModelContext(),
});
