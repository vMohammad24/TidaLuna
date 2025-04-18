const prefix = "[Luna.core]";
export const log = (...args) => console.log(prefix, ...args);
export const logWarn = (...args) => console.warn(prefix, ...args);
export const logErr = (...args) => console.error(prefix, ...args);
