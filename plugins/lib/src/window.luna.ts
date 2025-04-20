import type { LunaUnload } from "@luna/core";

// This is here to avoid cyclic dependencies
export const unloads = new Set<LunaUnload>();
