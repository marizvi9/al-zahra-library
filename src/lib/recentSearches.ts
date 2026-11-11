// Recent searches, kept only in this browser (localStorage). Nothing is sent anywhere.
// Up to 6 are kept, newest first; repeats move to the top instead of appearing twice.
// If the browser blocks storage (private mode etc.), everything quietly does nothing.

const KEY = "azl-recent-searches";
const MAX = 6;
const EVENT = "azl-recent-searches-change"; // keeps every search bar on the page in step

const tidy = (q: string) => q.trim().replace(/\s+/g, " ");

export function getRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function save(list: string[]) {
  try {
    if (list.length) localStorage.setItem(KEY, JSON.stringify(list));
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

export function addRecent(q: string) {
  const t = tidy(q);
  if (t.length < 2) return;
  save([t, ...getRecent().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX));
}

export function removeRecent(q: string) {
  save(getRecent().filter((x) => x !== q));
}

export function clearRecent() {
  save([]);
}

/** Call `fn` whenever the list changes (in this tab or another one). Returns an unsubscribe function. */
export function onRecentChange(fn: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && fn();
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", onStorage);
  };
}
