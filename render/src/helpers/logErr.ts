import { actions } from "../core/window.core.js";

// Super quick helper based on @luna/lib Tracer for logging errors in core
export const logErr = (...args) => console.error("[LUNA]", ...args);
logErr.msg = (...args) => {
	// Reduce to string for Tidal alert message popup
	const message = args
		.map((args) => {
			if (args instanceof Error) return args.message;
			if (typeof args === "object") return "";
			return String(args);
		})
		.join(" ");
	actions["message/MESSAGE_ERROR"]?.({ message: `[LUNA] ${message}`, category: "OTHER", severity: "ERROR" });
};
