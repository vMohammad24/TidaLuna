import { Tracer, type LunaUnload } from "@luna/core";

export const { trace: uTrace, errSignal } = Tracer("[@luna/unstable]");

export const unloads = new Set<LunaUnload>();
