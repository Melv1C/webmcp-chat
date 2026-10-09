import { installWebMCP } from "@mcp-b/webmcp-polyfill";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { registerShopTools } from "./register-tools";
import "./index.css";

installWebMCP();
registerShopTools(new AbortController().signal);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
