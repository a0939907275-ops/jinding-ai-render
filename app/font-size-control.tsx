"use client";

import { useEffect, useState } from "react";

const levels = [90, 100, 110, 120, 130];

export default function FontSizeControl() {
  const [size, setSize] = useState(100);
  useEffect(() => {
    const saved = Number(localStorage.getItem("jinding-font-size"));
    const initial = levels.includes(saved) ? saved : 100;
    setSize(initial);
    document.documentElement.style.setProperty("--font-scale", String(initial / 100));
  }, []);
  function change(direction: -1 | 1) {
    const index = levels.indexOf(size);
    const next = levels[Math.max(0, Math.min(levels.length - 1, index + direction))];
    setSize(next);
    localStorage.setItem("jinding-font-size", String(next));
    document.documentElement.style.setProperty("--font-scale", String(next / 100));
  }
  return <div className="font-size-control" aria-label="字體大小控制"><button type="button" onClick={() => change(-1)} disabled={size === levels[0]} aria-label="縮小字體">A−</button><output aria-live="polite">{size}%</output><button type="button" onClick={() => change(1)} disabled={size === levels.at(-1)} aria-label="放大字體">A＋</button></div>;
}
