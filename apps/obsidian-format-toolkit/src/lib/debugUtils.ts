import { Notice } from "obsidian";

export const DEBUG = !(process.env.BUILD_ENV === "production");
if (DEBUG) console.log("DEBUG is enabled");

export function debugLog(...args: unknown[]) {
  if (DEBUG) {
    console.log(new Date().toISOString().slice(11, 23), ...args);
  }
}

export function debugNotice(message: string) {
  if (DEBUG) {
    new Notice(message);
  }
}