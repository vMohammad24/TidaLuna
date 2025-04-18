// Ick import types from core
import type { LunaUnload } from ".";

// See render/window.core.ts
/**
 * Modules that are loaded in the window by tidal
 */
export const tidalModules = window.luna.tidalModules;
export const ReactiveStore = window.luna.ReactiveStore;
export const LunaPlugin = window.luna.LunaPlugin;
export const _buildActions = window.luna._buildActions;

export const unloads = new Set<LunaUnload>();
