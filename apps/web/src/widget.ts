import { isWebmcpChatOpenMessage } from "@/lib/embed-protocol";

const LAUNCHER = 36;
const PANEL_WIDTH = 384;
const PANEL_HEIGHT = 576;
const EDGE = 16;
const MOBILE_INSET = 12;

function widgetOrigin() {
  return new URL(import.meta.url).origin;
}

function applyIframeBox(host: HTMLElement, open: boolean) {
  const mobile = window.matchMedia("(max-width: 639px)").matches;
  const box =
    "position:fixed;z-index:2147483647;border:0;overflow:hidden;pointer-events:auto;";

  if (!open) {
    host.style.cssText = `${box}width:${LAUNCHER}px;height:${LAUNCHER}px;right:${EDGE}px;bottom:${EDGE}px;`;
    return;
  }

  if (mobile) {
    host.style.cssText = `${box}inset:${MOBILE_INSET}px;width:auto;height:auto;`;
    return;
  }

  const height = Math.min(PANEL_HEIGHT, window.innerHeight - EDGE * 2);
  host.style.cssText = `${box}width:${PANEL_WIDTH}px;height:${height}px;right:${EDGE}px;bottom:${EDGE}px;`;
}

class WebmcpChatElement extends HTMLElement {
  #iframe: HTMLIFrameElement | null = null;
  #open = false;

  connectedCallback() {
    this.#mount();
  }

  disconnectedCallback() {
    this.#unmount();
  }

  #mount() {
    applyIframeBox(this, false);
    const iframe = document.createElement("iframe");
    iframe.title = "WebMCP Chat";
    iframe.setAttribute("allow", "clipboard-write; tools");
    iframe.style.cssText =
      "display:block;width:100%;height:100%;border:0;background:transparent;color-scheme:none;";
    const src = new URL("/", widgetOrigin());
    src.searchParams.set("hostOrigin", location.origin);
    iframe.src = src.toString();
    this.#iframe = iframe;
    this.append(iframe);
    window.addEventListener("message", this.#onMessage);
    window.addEventListener("resize", this.#onResize);
  }

  #onMessage = (event: MessageEvent) => {
    if (event.origin !== widgetOrigin()) {
      return;
    }

    if (!isWebmcpChatOpenMessage(event.data)) {
      return;
    }

    this.#open = event.data.open;
    applyIframeBox(this, this.#open);
  };

  #onResize = () => {
    if (this.#iframe) {
      applyIframeBox(this, this.#open);
    }
  };

  #unmount() {
    window.removeEventListener("message", this.#onMessage);
    window.removeEventListener("resize", this.#onResize);
    this.#iframe?.remove();
    this.#iframe = null;
    this.#open = false;
    this.replaceChildren();
    this.removeAttribute("style");
  }
}

if (!customElements.get("webmcp-chat")) {
  customElements.define("webmcp-chat", WebmcpChatElement);
}
