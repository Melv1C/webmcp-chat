import { createContext } from "react";

export const PortalContainer = createContext<ShadowRoot | undefined>(undefined);
