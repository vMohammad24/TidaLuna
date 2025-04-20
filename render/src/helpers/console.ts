const prefix = "[Luna.core]";
export const log = (...args: any[]) => console.log(prefix, ...args);
export const logWarn = (...args: any[]) => console.warn(prefix, ...args);
export const logErr = (...args: any[]) => console.error(prefix, ...args);
