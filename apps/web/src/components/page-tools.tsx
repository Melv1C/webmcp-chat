import type { AnyClientTool } from "@tanstack/ai-client";
import { WrenchIcon } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PageToolsContextValue = {
  tools: AnyClientTool[];
  listOpen: boolean;
  setListOpen: (open: boolean) => void;
  listId: string;
  prefill: { nonce: number; text: string };
  pickTool: (tool: AnyClientTool) => void;
};

const PageToolsContext = createContext<PageToolsContextValue | null>(null);

export function usePageTools() {
  return useContext(PageToolsContext);
}

function toolDescription(tool: AnyClientTool) {
  return "description" in tool && typeof tool.description === "string"
    ? tool.description
    : "";
}

export function PageToolsProvider({
  tools,
  children,
}: {
  tools: AnyClientTool[];
  children: ReactNode;
}) {
  const listId = useId();
  const [listOpen, setListOpen] = useState(false);
  const [prefill, setPrefill] = useState({ nonce: 0, text: "" });

  useEffect(() => {
    if (tools.length === 0) {
      setListOpen(false);
    }
  }, [tools.length]);

  const value = useMemo(
    () => ({
      tools,
      listOpen: listOpen && tools.length > 0,
      setListOpen,
      listId,
      prefill,
      pickTool(tool: AnyClientTool) {
        const description = toolDescription(tool).trim();
        setPrefill((current) => ({
          nonce: current.nonce + 1,
          text: description || tool.name,
        }));
        setListOpen(false);
      },
    }),
    [listId, listOpen, prefill, tools],
  );

  return (
    <PageToolsContext.Provider value={value}>
      {children}
    </PageToolsContext.Provider>
  );
}

export function PageToolsToggle() {
  const pageTools = usePageTools();

  if (!pageTools || pageTools.tools.length === 0) {
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
            aria-expanded={pageTools.listOpen}
            aria-controls={pageTools.listId}
            aria-pressed={pageTools.listOpen}
            onClick={() => pageTools.setListOpen(!pageTools.listOpen)}
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
  const pageTools = usePageTools();

  if (!pageTools) {
    return null;
  }

  const count = pageTools.tools.length;
  const headingId = `${pageTools.listId}-heading`;

  return (
    <section
      id={pageTools.listId}
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
          {pageTools.tools.map((tool) => {
            const description = toolDescription(tool);
            return (
              <li key={tool.name}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={() => pageTools.pickTool(tool)}
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
