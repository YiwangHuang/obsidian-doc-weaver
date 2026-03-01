import { Notice } from "obsidian";

export const DEBUG = import.meta.env.DEV;
export const logger = {
  debug: (...args: unknown[]) => {if (DEBUG) console.debug(...args)},
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

if (DEBUG) logger.debug("DEBUG is enabled");


// export function logger.debug(...args: unknown[]) {
//   if (DEBUG) {
//     console.log(new Date().toISOString().slice(11, 23), ...args);
//   }
// }

export function debugNotice(message: string) {
  if (DEBUG) {
    new Notice(message);
  }
}