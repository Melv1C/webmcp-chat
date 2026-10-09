export const WEBMCP_CHAT_OPEN = "webmcp-chat:open";

export type WebmcpChatOpenMessage = {
  type: typeof WEBMCP_CHAT_OPEN;
  open: boolean;
};

export function isWebmcpChatOpenMessage(
  data: unknown,
): data is WebmcpChatOpenMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    data.type === WEBMCP_CHAT_OPEN &&
    "open" in data &&
    typeof data.open === "boolean"
  );
}
