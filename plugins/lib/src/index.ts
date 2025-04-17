export * from "./exports";
import * as luna from "./exports";
window.luna = luna;

declare global {
	interface Window {
		// Shouldnt be touching window.luna outside of here and window.core anwyay
		luna: typeof luna;
	}
}
