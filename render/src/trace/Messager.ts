import { buildActions } from "../exposeTidalInternals.patchAction";
import { reduxStore } from "../modules";
import { sanitizeData } from "./sanitizeData";

export class Messager {
	public static Info(...data: any[]) {
		reduxStore.dispatch(buildActions["message/MESSAGE_INFO"]?.({ message: sanitizeData(...data), category: "OTHER", severity: "INFO" }));
	}
	public static Warn(...data: any[]) {
		reduxStore.dispatch(buildActions["message/MESSAGE_WARN"]?.({ message: sanitizeData(...data), category: "OTHER", severity: "MESSAGE_WARN" }));
	}
	public static Error(...data: any[]) {
		reduxStore.dispatch(buildActions["message/MESSAGE_ERROR"]?.({ message: sanitizeData(...data), category: "OTHER", severity: "ERROR" }));
	}
}
