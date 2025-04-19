declare module "@luna/core" {
	export * from "@luna/_core";
}
declare module "@luna/lib" {
	export * from "@luna/_lib";
}
declare module "@luna/ui" {
	export * from "@luna/_ui";
}
declare module "file://*" {
	const value: string;
	export default value;
}
