"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type LazyVideoProps = {
  src: string;
  className?: string;
  children?: ReactNode;
};

export function LazyVideo({ src, className, children }: LazyVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSrc(src);
          } else {
            setActiveSrc(null);
          }
        });
      },
      { root: null, rootMargin: "500px 0px", threshold: 0 }
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!activeSrc) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      return;
    }

    void video.play().catch(() => {});
  }, [activeSrc]);

  return (
    <div ref={containerRef} className="h-full w-full min-h-0">
      <video
        ref={videoRef}
        className={className}
        src={activeSrc ?? undefined}
        muted
        loop
        playsInline
        preload="none"
      >
        {children}
      </video>
    </div>
  );
}
