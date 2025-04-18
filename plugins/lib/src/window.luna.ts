import type { AnyRecord } from "@inrixia/helpers";

// Ick import types from core
import type * as LP from "../../../render/src/LunaPlugin";

// See render/core/window.core.ts
export const moduleCache: Record<string, any> = window.luna.tidalModules;

// See render/core/storage.ts
export const storage: Record<string, AnyRecord> = window.luna.storage;

// See render/LunaPlugin.ts
export const LunaPlugin: typeof LP.LunaPlugin = window.luna.LunaPlugin;

export const _buildActions: Record<string, Function> = window.luna._buildActions;
