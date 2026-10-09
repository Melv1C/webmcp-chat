import "@vitejs/plugin-react/preamble";
import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ChatWidget } from "@/components/chat-widget";
import { PortalContainer } from "@/lib/portal-container";
import css from "./index.css?inline";

const sheet = new CSSStyleSheet({ baseURL: import.meta.url });
sheet.replaceSync(css);

// Browsers ignore @property and @font-face inside shadow roots.
const documentSheet = new CSSStyleSheet({ baseURL: import.meta.url });
documentSheet.replaceSync(
  Array.from(sheet.cssRules)
    .filter((rule) => rule instanceof CSSPropertyRule || rule instanceof CSSFontFaceRule)
    .map((rule) => rule.cssText)
    .join("\n"),
);
document.adoptedStyleSheets.push(documentSheet);

class WebmcpChatElement extends HTMLElement {
  #root: Root | null = null;

  connectedCallback() {
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [sheet];
    this.#root = createRoot(shadow);
    this.#root.render(
      <StrictMode>
        <PortalContainer value={shadow}>
          <ChatWidget />
        </PortalContainer>
      </StrictMode>,
    );
  }

  disconnectedCallback() {
    this.#root?.unmount();
    this.#root = null;
  }
}

if (!customElements.get("webmcp-chat")) {
  customElements.define("webmcp-chat", WebmcpChatElement);
}
