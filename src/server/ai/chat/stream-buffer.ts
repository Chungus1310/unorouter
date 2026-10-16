import { uid } from "@/lib/utils/base";
import { networkInterfaces } from "node:os";

// A phone that backgrounds the tab (iOS freezes it within seconds) drops the
// connection mid reply. The reply keeps streaming into this buffer so the tab
// can fetch the rest when it comes back, from either replica.

const KEEP_AFTER_DONE_MS = 10 * 60_000;
const MAX_RUN_MS = 30 * 60_000;
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ENTRIES = 500;

type Entry = {
  userId: number;
  chunks: Uint8Array[];
  bytes: number;
  done: boolean;
  wake: Set<() => void>;
  abort: () => void;
  doneAt: number | null;
};

const entries = new Map<string, Entry>();

export const STREAM_ID_HEADER = "x-uno-stream";
export const STREAM_POD_HEADER = "x-uno-pod";

export const podAddress = (() => {
  for (const list of Object.values(networkInterfaces())) {
    for (const nic of list ?? []) {
      if (nic.family === "IPv4" && !nic.internal) return nic.address;
    }
  }
  return null;
})();

function sweep() {
  const now = Date.now();
  for (const [id, entry] of entries) {
    if (entry.doneAt !== null && now - entry.doneAt > KEEP_AFTER_DONE_MS)
      entries.delete(id);
  }
  while (entries.size >= MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    entries.get(oldest)?.abort();
    entries.delete(oldest);
  }
}

function finish(entry: Entry) {
  entry.done = true;
  entry.doneAt = Date.now();
  entry.wake.forEach((fn) => fn());
  entry.wake.clear();
}

function append(entry: Entry, chunk: Uint8Array) {
  entry.chunks.push(chunk);
  entry.bytes += chunk.byteLength;
  entry.wake.forEach((fn) => fn());
  entry.wake.clear();
}

// Reads the source to the end whether or not anyone is listening; `abort`
// stops it for real (the Stop button), a dropped connection does not.
export function bufferStream(
  source: ReadableStream<Uint8Array>,
  userId: number,
  abort: () => void,
): string {
  sweep();
  const id = uid(24);
  const entry: Entry = {
    userId,
    chunks: [],
    bytes: 0,
    done: false,
    wake: new Set(),
    abort,
    doneAt: null,
  };
  entries.set(id, entry);
  const deadline = setTimeout(abort, MAX_RUN_MS);
  void (async () => {
    const reader = source.getReader();
    try {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        if (entry.bytes + chunk.value.byteLength > MAX_BYTES) {
          abort();
          break;
        }
        append(entry, chunk.value);
      }
    } catch {
      // The listener already holds every byte that arrived; nothing to add.
    } finally {
      clearTimeout(deadline);
      finish(entry);
    }
  })();
  return id;
}

// The bytes from `from` onward, waiting for more until the source ends.
export function tailStream(
  id: string,
  userId: number,
  from: number,
): ReadableStream<Uint8Array> | null {
  const entry = entries.get(id);
  if (!entry || entry.userId !== userId || from > entry.bytes) return null;
  let offset = from;
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      for (;;) {
        if (cancelled) return;
        if (offset < entry.bytes) {
          let skip = offset;
          const out: Uint8Array[] = [];
          for (const chunk of entry.chunks) {
            if (skip >= chunk.byteLength) {
              skip -= chunk.byteLength;
              continue;
            }
            out.push(skip > 0 ? chunk.subarray(skip) : chunk);
            skip = 0;
          }
          for (const part of out) controller.enqueue(part);
          offset = entry.bytes;
          return;
        }
        if (entry.done) {
          controller.close();
          return;
        }
        await new Promise<void>((resolve) => entry.wake.add(resolve));
      }
    },
    cancel() {
      cancelled = true;
    },
  });
}

export function abortStream(id: string, userId: number): boolean {
  const entry = entries.get(id);
  if (!entry || entry.userId !== userId) return false;
  entry.abort();
  return true;
}

// A returning tab may land on the other replica; only a pod address inside
// the cluster pod range is ever dialed.
export function peerUrl(pod: string | null, path: string): string | null {
  if (!pod || pod === podAddress) return null;
  if (!/^10\.42\.\d{1,3}\.\d{1,3}$/.test(pod)) return null;
  return `http://${pod}:${process.env.PORT ?? "3000"}${path}`;
}
