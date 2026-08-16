"use client";

import { useEffect, useSyncExternalStore } from "react";

const levels = [90, 100, 110, 120, 130];
const eventName = "jinding-font-size-change";
function readSize() { const saved = Number(localStorage.getItem("jinding-font-size")); return levels.includes(saved) ? saved : 100; }
function subscribe(callback: () => void) { window.addEventListener("storage", callback); window.addEventListener(eventName, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(eventName, callback); }; }

export default function FontSizeControl() {
  const size = useSyncExternalStore(subscribe, readSize, () => 100);
  useEffect(() => { document.documentElement.style.setProperty("--font-scale", String(size / 100)); }, [size]);
  function change(direction: -1 | 1) {
    const index = levels.indexOf(size);
    const next = levels[Math.max(0, Math.min(levels.length - 1, index + direction))];
    localStorage.setItem("jinding-font-size", String(next));
    window.dispatchEvent(new Event(eventName));
  }
  return <div className="font-size-control" aria-label="字體大小控制"><button type="button" onClick={() => change(-1)} disabled={size === levels[0]} aria-label="縮小字體">A−</button><output aria-live="polite">{size}%</output><button type="button" onClick={() => change(1)} disabled={size === levels.at(-1)} aria-label="放大字體">A＋</button></div>;
}
