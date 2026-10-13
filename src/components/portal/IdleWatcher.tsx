"use client";

import { useEffect, useRef } from "react";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "wheel", "touchstart"] as const;
const HEARTBEAT_MS = 2 * 60_000;

// AP1A_03 — signs the session out after `idleMinutes` without activity,
// and keeps the server-side session alive while the user is working on one page.
export function IdleWatcher({ idleMinutes }: { idleMinutes: number }) {
  const lastActivity = useRef(0);
  const lastHeartbeat = useRef(0);

  useEffect(() => {
    const now = Date.now();
    lastActivity.current = now;
    lastHeartbeat.current = now;
    // Full navigation on purpose: the route handler clears the auth cookies.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    const expire = () => window.location.assign("/api/auth/expire");
    const onActivity = () => { lastActivity.current = Date.now(); };
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));

    const timer = window.setInterval(async () => {
      const current = Date.now();
      if (current - lastActivity.current >= idleMinutes * 60_000) {
        expire();
        return;
      }
      if (lastActivity.current > lastHeartbeat.current && current - lastHeartbeat.current >= HEARTBEAT_MS) {
        lastHeartbeat.current = current;
        const response = await fetch("/api/session/heartbeat", { method: "POST" }).catch(() => null);
        if (response?.status === 401) expire();
      }
    }, 15_000);

    return () => {
      window.clearInterval(timer);
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
    };
  }, [idleMinutes]);

  return null;
}
