import { useRegisterWebMCPTools } from "@tanstack/ai-react";
import { ChatWidget } from "@/components/chat-widget";
import { TooltipProvider } from "@/components/ui/tooltip";
import { hostPageTools } from "@/lib/page-tool";

function App() {
  useRegisterWebMCPTools(hostPageTools);

  return (
    <TooltipProvider>
      <main className="min-h-svh bg-background">
        <ChatWidget />
      </main>
    </TooltipProvider>
  );
}

export default App;
