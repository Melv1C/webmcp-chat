import { ChatWidget } from "@/components/chat-widget";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  return (
    <TooltipProvider>
      <main className="min-h-svh bg-background">
        <ChatWidget />
      </main>
    </TooltipProvider>
  );
}

export default App;
