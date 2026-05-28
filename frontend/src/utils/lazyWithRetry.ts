/**
 * lazyWithRetry — wraps React.lazy() with automatic retry logic.
 * 
 * When a chunk fails to load (e.g., stale hash after Cloudflare deployment),
 * it retries once. If it still fails, it forces a hard page reload.
 * This prevents users from seeing the "Failed to fetch dynamically imported module" 
 * error on first navigation after a new deployment.
 */
import { lazy } from "react";

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 500;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function importWithRetry<T>(
  importFn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await importFn();
  } catch (error: any) {
    const isChunkError =
      error?.message?.toLowerCase().includes("failed to fetch") ||
      error?.message?.toLowerCase().includes("dynamically imported module") ||
      error?.name === "ChunkLoadError";

    if (isChunkError && retries > 0) {
      await wait(RETRY_DELAY_MS);
      return importWithRetry(importFn, retries - 1);
    }

    // Out of retries — force a full reload to pick up new deployment
    if (isChunkError) {
      window.location.reload();
      // Return a never-resolving promise so React doesn't render broken state
      return new Promise(() => {});
    }

    throw error;
  }
}

export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() => importWithRetry(factory));
}
