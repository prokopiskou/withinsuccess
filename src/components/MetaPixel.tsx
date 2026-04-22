"use client";
import { useEffect } from "react";

const PIXEL_ID = "1653590555890252";

export function trackEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (window as any).fbq === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).fbq("track", event, params);
}

export default function MetaPixel() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).fbq) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fbq: any = function (...args: unknown[]) {
      fbq.queue.push(args);
    };
    fbq.queue = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).fbq = fbq;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)._fbq = fbq;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).fbq("init", PIXEL_ID);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).fbq("track", "PageView");
  }, []);

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
}