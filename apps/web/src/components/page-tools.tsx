import type { AnyClientTool } from "@tanstack/ai-client";
import { WrenchIcon } from "lucide-react";
import { create } from "zustand";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const PAGE_TOOLS_LIST_ID = "page-tools-list";

type PageToolsState = {
  tools: AnyClientTool[];
  listOpen: boolean;
  prefill: { nonce: number; text: string };
  setTools: (tools: AnyClientTool[]) => void;
  setListOpen: (open: boolean) => void;
  pickTool: (tool: AnyClientTool) => void;
};

export const usePageToolsStore = create<PageToolsState>((set) => ({
  tools: [],
  listOpen: false,
  prefill: { nonce: 0, text: "" },
  setTools(tools) {
    set((state) => ({
      tools,
      listOpen: tools.length === 0 ? false : state.listOpen,
    }));
  },
  setListOpen(open) {
    set((state) => ({
      listOpen: open && state.tools.length > 0,
    }));
  },
  pickTool(tool) {
    set((state) => ({
      prefill: {
        nonce: state.prefill.nonce + 1,
        text: `\`${tool.name}\``,
      },
      listOpen: false,
    }));
  },
}));

function toolDescription(tool: AnyClientTool) {
  return "description" in tool && typeof tool.description === "string"
    ? tool.description
    : "";
}

export function PageToolsToggle() {
  const toolCount = usePageToolsStore((state) => state.tools.length);
  const listOpen = usePageToolsStore((state) => state.listOpen);
  const setListOpen = usePageToolsStore((state) => state.setListOpen);

  if (toolCount === 0) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Tools on this page"
            aria-expanded={listOpen}
            aria-controls={PAGE_TOOLS_LIST_ID}
            aria-pressed={listOpen}
            onClick={() => setListOpen(!listOpen)}
          />
        }
      >
        <WrenchIcon />
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end">
        Tools on this page
      </TooltipContent>
    </Tooltip>
  );
}

export function PageToolsList() {
  const tools = usePageToolsStore((state) => state.tools);
  const pickTool = usePageToolsStore((state) => state.pickTool);
  const count = tools.length;
  const headingId = `${PAGE_TOOLS_LIST_ID}-heading`;

  return (
    <section
      id={PAGE_TOOLS_LIST_ID}
      aria-labelledby={headingId}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex items-baseline justify-between gap-2 px-3 pt-3 pb-1">
        <h3 id={headingId} className="text-sm font-semibold">
          On this page
        </h3>
        <p className="text-xs text-muted-foreground">
          {count} {count === 1 ? "tool" : "tools"}
        </p>
      </div>
      <p className="px-3 pb-2 text-xs leading-5 text-muted-foreground">
        The assistant can use these while you chat. Pick one to ask about it.
      </p>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="flex flex-col gap-0.5 px-1.5 pb-2">
          {tools.map((tool) => {
            const description = toolDescription(tool);
            return (
              <li key={tool.name}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={() => pickTool(tool)}
                >
                  <WrenchIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium">{tool.name}</span>
                    {description ? (
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                        {description}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </section>
  );
}
