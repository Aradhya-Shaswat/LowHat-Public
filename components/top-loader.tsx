"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<"idle" | "loading" | "completing">("idle");
  const startTimeRef = useRef(0);
  const completingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 
  const pendingRef = useRef(false);

  const cleanup = useCallback(() => {
    if (completingTimerRef.current) clearTimeout(completingTimerRef.current);
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    completingTimerRef.current = null;
    delayTimerRef.current = null;
    pendingRef.current = false;
  }, []);

  const startLoading = useCallback(() => {
    cleanup();
    pendingRef.current = true;
    startTimeRef.current = Date.now();
    delayTimerRef.current = setTimeout(() => {
      if (pendingRef.current) {
        setPhase("loading");
      }
    }, 120);
  }, [cleanup]);

  const completeLoading = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;

    if (phase === "idle" && !pendingRef.current) return;
    if (phase === "idle" && elapsed < 120) {
      cleanup();
      return;
    }

    cleanup();
    setPhase("completing");
    completingTimerRef.current = setTimeout(() => {
      setPhase("idle");
    }, 500); 
  }, [phase, cleanup]);

  useEffect(() => {
    completeLoading();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (
        anchor.target === "_blank" ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) return;

      const url = new URL(href, window.location.origin);
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) return;

      startLoading();
    };

    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);

    window.history.pushState = function (...args) {
      startLoading();
      return origPush(...args);
    };
    window.history.replaceState = function (...args) {
      startLoading();
      return origReplace(...args);
    };

    const handlePopState = () => startLoading();

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      cleanup();
    };
  }, [startLoading, cleanup]);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden
      className="top-loader-track"
      data-phase={phase}
    >
      <div className="top-loader-bar" />
    </div>
  );
}
