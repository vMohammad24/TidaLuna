import type { AnyRecord } from "@inrixia/helpers";

// Ick import types from core
import type * as LP from "@luna/core/LunaPlugin";

// See render/window.core.ts
export const tidalModules: Record<string, any> = window.luna.tidalModules;
export const storage: Record<string, AnyRecord> = window.luna.storage;
export const LunaPlugin: typeof LP.LunaPlugin = window.luna.LunaPlugin;
export const _buildActions: Record<string, Function> = window.luna._buildActions;
