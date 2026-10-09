import {
  addJob,
  deleteJob,
  getPage,
  listJobs,
  openPage,
  type Page,
  updateJob,
} from "./store";

type PageTool = {
  name: string;
  description: string;
};

type ModelContext = {
  registerTool(
    tool: {
      name: string;
      description: string;
      inputSchema?: object;
      execute: (input: object) => unknown | Promise<unknown>;
    },
    options: { signal: AbortSignal; exposedTo?: string[] },
  ): Promise<void>;
  getTools(): Promise<Array<PageTool>>;
};

function widgetOrigin() {
  const script = document.querySelector<HTMLScriptElement>(
    'script[src*="widget.js"]',
  );
  if (script?.src) {
    return new URL(script.src).origin;
  }

  return "http://localhost:5173";
}

function modelContext(): ModelContext | undefined {
  if (!("modelContext" in document)) {
    return;
  }

  return document.modelContext as ModelContext;
}

function stringField(input: object, key: string) {
  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function booleanField(input: object, key: string) {
  const value = (input as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : undefined;
}

function requireId(input: object) {
  const id = stringField(input, "id")?.trim();
  if (!id) {
    throw new Error("id is required.");
  }
  return id;
}

const pages = ["desk", "done", "shop"] as const;

function readPage(input: object): Page {
  const page = stringField(input, "page");
  if (page === "desk" || page === "done" || page === "shop") {
    return page;
  }
  throw new Error(`page must be one of ${pages.join(", ")}.`);
}

export function registerShopTools(signal: AbortSignal) {
  const context = modelContext();
  if (!context) {
    return;
  }

  const options = { signal, exposedTo: [widgetOrigin()] };

  void context.registerTool(
    {
      name: "getPageContext",
      description:
        "Read the current page name, title, URL, and the tools this shop registered.",
      inputSchema: { type: "object", properties: {} },
      async execute() {
        const tools = await context.getTools();
        return {
          page: getPage(),
          title: document.title,
          url: location.href,
          tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
          })),
        };
      },
    },
    options,
  );

  void context.registerTool(
    {
      name: "listJobs",
      description:
        "List work jobs on the shop board. status is open, done, or all.",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["open", "done", "all"] },
        },
      },
      execute(input) {
        const status = stringField(input, "status");
        const filter =
          status === "open" || status === "done" || status === "all"
            ? status
            : "all";
        return {
          page: getPage(),
          status: filter,
          jobs: listJobs(filter),
        };
      },
    },
    options,
  );

  void context.registerTool(
    {
      name: "addJob",
      description: "Add an open job to the shop desk. Needs a title.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          notes: { type: "string" },
        },
        required: ["title"],
      },
      execute(input) {
        const title = stringField(input, "title") ?? "";
        return addJob(title, stringField(input, "notes"));
      },
    },
    options,
  );

  void context.registerTool(
    {
      name: "updateJob",
      description:
        "Update a job by id. Can change title, notes, or done (true marks it finished).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          notes: { type: "string" },
          done: { type: "boolean" },
        },
        required: ["id"],
      },
      execute(input) {
        return updateJob(requireId(input), {
          title: stringField(input, "title"),
          notes: stringField(input, "notes"),
          done: booleanField(input, "done"),
        });
      },
    },
    options,
  );

  void context.registerTool(
    {
      name: "deleteJob",
      description: "Remove a job from the board by id.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      execute(input) {
        return deleteJob(requireId(input));
      },
    },
    options,
  );

  void context.registerTool(
    {
      name: "openPage",
      description:
        "Navigate the shop site. page is desk (open jobs), done (finished jobs), or shop (hours).",
      inputSchema: {
        type: "object",
        properties: {
          page: { type: "string", enum: [...pages] },
        },
        required: ["page"],
      },
      execute(input) {
        return openPage(readPage(input));
      },
    },
    options,
  );
}
