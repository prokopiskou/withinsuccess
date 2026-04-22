"use client";
import { useEffect } from "react";

const PIXEL_ID = "1653590555890252";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

export function trackEvent(event: string, params?: object) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params);
}

export default function MetaPixel() {
  useEffect(() => {
    if (window.fbq) return;
    const n = function (...args: unknown[]) {
      (n as unknown as { queue: unknown[][] }).queue.push(args);
    } as unknown as typeof window.fbq & { queue: unknown[][] };
    n.queue = [];
    window.fbq = n;
    window._fbq = n;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
  }, []);

  return (
    <noscript>
      <img height="1" width="1" style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
}