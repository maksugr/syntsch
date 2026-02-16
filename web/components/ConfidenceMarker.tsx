"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function ConfidenceMarker({
  text,
  tooltip,
  color,
}: {
  text: string;
  tooltip: string;
  color?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: PointerEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [open, close]);

  useEffect(() => {
    if (!open || !tooltipRef.current) return;
    const el = tooltipRef.current;
    const rect = el.getBoundingClientRect();
    if (rect.left < 8) {
      el.style.transform = `translateX(${8 - rect.left}px)`;
    } else if (rect.right > window.innerWidth - 8) {
      el.style.transform = `translateX(${window.innerWidth - 8 - rect.right}px)`;
    } else {
      el.style.transform = "";
    }
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative inline cursor-help transition-colors duration-150"
      style={{
        backgroundColor: color
          ? `${color}${open ? "22" : "12"}`
          : open ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.04)",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={close}
      onPointerDown={(e) => {
        if (e.pointerType === "touch") {
          e.preventDefault();
          setOpen((v) => !v);
        }
      }}
    >
      {text}
      {open && (
        <span
          ref={tooltipRef}
          className="absolute left-0 top-full mt-1 z-50 max-w-xs px-3 py-2 text-white text-xs leading-snug font-mono whitespace-normal"
          style={{ backgroundColor: color || "#000" }}
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}
