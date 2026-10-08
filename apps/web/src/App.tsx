import { Button } from "@/components/ui/button";

function App() {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-6 py-16 text-foreground">
      <section className="w-full max-w-xl space-y-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">WebMCP Chat</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Your starter is ready.
        </h1>
        <p className="mx-auto max-w-md text-base leading-7 text-muted-foreground">
          The React app and Hono API live in separate workspaces. Add the chat
          experience when you are ready.
        </p>
        <Button variant="outline">UI components are ready</Button>
      </section>
    </main>
  );
}

export default App;
