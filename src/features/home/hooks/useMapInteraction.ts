import { useCallback, useEffect, useRef, useState } from "react";

import {
  ACTIVATION_RADIUS,
  DEACTIVATION_RADIUS,
  DISMISS_DELAY,
  distanceToRect,
  isPointInCorridor,
  MAP_HEIGHT,
  MAP_WIDTH,
  SWITCH_MARGIN,
  type BubbleLayout,
  type ProjectedCityPoint,
} from "@/features/home/utils/mapData";

export type UseMapInteractionProps = {
  points: ProjectedCityPoint[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onMarkerSelect?: (markerId: string | null) => void;
};

export function useMapInteraction({
  points,
  containerRef,
  onMarkerSelect,
}: UseMapInteractionProps) {
  // Authoritative interaction states
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [pinnedMarkerId, setPinnedMarkerId] = useState<string | null>(null);
  const [focusedMarkerId, setFocusedMarkerId] = useState<string | null>(null);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState("");

  // Derived active marker: pinned > focused > hovered
  const activeMarkerId = pinnedMarkerId ?? focusedMarkerId ?? hoveredMarkerId;
  const isPinned = pinnedMarkerId !== null;

  // Nearest marker for subtle exploratory hover when NO marker is active
  const [nearestMarkerId, setNearestMarkerId] = useState<string | null>(null);

  // Synchronized refs for zero-staleness RAF computations
  const hoveredMarkerIdRef = useRef<string | null>(null);
  hoveredMarkerIdRef.current = hoveredMarkerId;

  const pinnedMarkerIdRef = useRef<string | null>(null);
  pinnedMarkerIdRef.current = pinnedMarkerId;

  const activeMarkerIdRef = useRef<string | null>(null);
  activeMarkerIdRef.current = activeMarkerId;

  const bubbleLayoutRef = useRef<BubbleLayout | null>(null);
  const pointsRef = useRef<ProjectedCityPoint[]>(points);
  pointsRef.current = points;

  const isOverBubbleRef = useRef(false);
  const latestPointer = useRef<{ clientX: number; clientY: number } | null>(null);
  const rafId = useRef<number | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | number | null>(null);

  // Touch tracking to distinguish taps from scroll gestures
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isTouchScrollRef = useRef(false);
  const lastTouchTimeRef = useRef(0);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current !== null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const announceStory = useCallback((id: string | null, pinned = false) => {
    if (id) {
      const pt = pointsRef.current.find((p) => p.city.id === id);
      if (pt) {
        setScreenReaderAnnouncement(
          `Story displayed for ${pt.city.name}, ${pt.city.country}.${pinned ? " Pinned open." : ""}`,
        );
      }
    } else {
      setScreenReaderAnnouncement("");
    }
  }, []);

  // Update selection
  const selectMarker = useCallback(
    (id: string | null, pinned = false) => {
      clearDismissTimer();
      if (pinned) {
        setPinnedMarkerId(id);
        pinnedMarkerIdRef.current = id;
        setHoveredMarkerId(id);
        hoveredMarkerIdRef.current = id;
      } else {
        setHoveredMarkerId(id);
        hoveredMarkerIdRef.current = id;
      }
      activeMarkerIdRef.current = id;
      announceStory(id, pinned);
      onMarkerSelect?.(id);
    },
    [announceStory, clearDismissTimer, onMarkerSelect],
  );

  const dismiss = useCallback(() => {
    clearDismissTimer();
    isOverBubbleRef.current = false;
    pinnedMarkerIdRef.current = null;
    hoveredMarkerIdRef.current = null;
    activeMarkerIdRef.current = null;
    setPinnedMarkerId(null);
    setHoveredMarkerId(null);
    setFocusedMarkerId(null);
    setNearestMarkerId(null);
    announceStory(null, false);
    onMarkerSelect?.(null);
  }, [announceStory, clearDismissTimer, onMarkerSelect]);

  // Main evaluation logic executed once per animation frame
  const processPointerFrame = useCallback(() => {
    rafId.current = null;
    const ptr = latestPointer.current;
    const container = containerRef.current;
    if (!ptr || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const cursorX = ptr.clientX - rect.left;
    const cursorY = ptr.clientY - rect.top;

    // Check if cursor has left container boundaries
    if (cursorX < 0 || cursorX > rect.width || cursorY < 0 || cursorY > rect.height) {
      if (!pinnedMarkerIdRef.current && !isOverBubbleRef.current) {
        if (hoveredMarkerIdRef.current !== null && dismissTimerRef.current === null) {
          dismissTimerRef.current = setTimeout(() => {
            dismissTimerRef.current = null;
            if (!pinnedMarkerIdRef.current && !isOverBubbleRef.current) {
              setHoveredMarkerId(null);
              hoveredMarkerIdRef.current = null;
              onMarkerSelect?.(null);
            }
          }, DISMISS_DELAY);
        }
      }
      return;
    }

    // Pinned markers lock their state until explicitly toggled or dismissed
    if (pinnedMarkerIdRef.current !== null) {
      return;
    }

    const currentId = hoveredMarkerIdRef.current;
    const pts = pointsRef.current;

    let closestPoint: ProjectedCityPoint | null = null;
    let minDistance = Infinity;
    let currentMarkerDistance = Infinity;
    let activePointCoord: { x: number; y: number } | null = null;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (!p) continue;

      const screenX = (p.x / MAP_WIDTH) * rect.width;
      const screenY = (p.y / MAP_HEIGHT) * rect.height;
      const dist = Math.hypot(cursorX - screenX, cursorY - screenY);

      if (p.city.id === currentId) {
        currentMarkerDistance = dist;
        activePointCoord = { x: screenX, y: screenY };
      }
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = p;
      }
    }

    // Nearest marker: only show subtle approaching state when NO marker is active
    if (currentId === null && closestPoint && minDistance <= ACTIVATION_RADIUS) {
      setNearestMarkerId(closestPoint.city.id);
    } else {
      setNearestMarkerId(null);
    }

    // Check if cursor is directly over or within reading bounds of the active story bubble
    const bubble = bubbleLayoutRef.current;
    let isReadingBubble = isOverBubbleRef.current;

    if (!isReadingBubble && bubble && currentId !== null) {
      const distToBubble = distanceToRect(
        cursorX,
        cursorY,
        bubble.left,
        bubble.top,
        bubble.width,
        bubble.height,
      );
      if (distToBubble <= 4) {
        isReadingBubble = true;
      }
    }

    // Check if cursor is navigating within the transit corridor between marker & bubble
    let isInTransitCorridor = false;
    if (!isReadingBubble && bubble && activePointCoord) {
      isInTransitCorridor = isPointInCorridor(
        cursorX,
        cursorY,
        activePointCoord.x,
        activePointCoord.y,
        bubble,
        10,
      );
    }

    // Priority 1: Approaching a new or closer marker ALWAYS overrides corridor / bubble
    const isOtherMarkerTargeted =
      closestPoint &&
      closestPoint.city.id !== currentId &&
      minDistance <= ACTIVATION_RADIUS &&
      (currentId === null || minDistance < currentMarkerDistance - SWITCH_MARGIN);

    let nextId: string | null = currentId;

    if (isOtherMarkerTargeted && closestPoint) {
      // Switched to a new marker
      nextId = closestPoint.city.id;
    } else if (isReadingBubble) {
      // Actively reading or hovering bubble
      nextId = currentId;
    } else if (isInTransitCorridor) {
      // In transit between active marker and bubble
      nextId = currentId;
    } else if (currentId !== null) {
      // Hysteresis: retain current marker if within DEACTIVATION_RADIUS
      if (currentMarkerDistance <= DEACTIVATION_RADIUS) {
        nextId = currentId;
      } else {
        nextId = null;
      }
    } else {
      if (closestPoint && minDistance <= ACTIVATION_RADIUS) {
        nextId = closestPoint.city.id;
      } else {
        nextId = null;
      }
    }

    // Handle state transitions
    if (nextId !== currentId) {
      if (nextId === null) {
        // Leaving active marker -> delay dismissal
        if (dismissTimerRef.current === null && currentId !== null) {
          dismissTimerRef.current = setTimeout(() => {
            dismissTimerRef.current = null;
            if (!pinnedMarkerIdRef.current && !isOverBubbleRef.current) {
              setHoveredMarkerId(null);
              hoveredMarkerIdRef.current = null;
              announceStory(null, false);
              onMarkerSelect?.(null);
            }
          }, DISMISS_DELAY);
        }
      } else {
        // Moving to a new marker -> switch immediately
        clearDismissTimer();
        setHoveredMarkerId(nextId);
        hoveredMarkerIdRef.current = nextId;
        setFocusedMarkerId(null);
        announceStory(nextId, false);
        onMarkerSelect?.(nextId);
      }
    } else if (currentId !== null) {
      // Still in active marker / bubble / corridor -> cancel any pending dismiss
      clearDismissTimer();
    }
  }, [announceStory, clearDismissTimer, containerRef, onMarkerSelect]);

  // Pointer move handler coalesced via single RAF
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") {
        if (touchStartRef.current) {
          const dx = Math.abs(e.clientX - touchStartRef.current.x);
          const dy = Math.abs(e.clientY - touchStartRef.current.y);
          if (dx > 8 || dy > 8) {
            isTouchScrollRef.current = true;
          }
        }
        return;
      }

      latestPointer.current = { clientX: e.clientX, clientY: e.clientY };

      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(processPointerFrame);
      }
    },
    [processPointerFrame],
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") return;

      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      latestPointer.current = null;
      isOverBubbleRef.current = false;
      setNearestMarkerId(null);

      if (!pinnedMarkerIdRef.current && hoveredMarkerIdRef.current !== null) {
        if (dismissTimerRef.current === null) {
          dismissTimerRef.current = setTimeout(() => {
            dismissTimerRef.current = null;
            if (!pinnedMarkerIdRef.current && !isOverBubbleRef.current) {
              setHoveredMarkerId(null);
              hoveredMarkerIdRef.current = null;
              announceStory(null, false);
              onMarkerSelect?.(null);
            }
          }, DISMISS_DELAY);
        }
      }
    },
    [announceStory, onMarkerSelect],
  );

  // Touch pointer down to record start coordinate
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") {
      touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      isTouchScrollRef.current = false;
      lastTouchTimeRef.current = Date.now();
    }
  }, []);

  // Touch pointer up to handle intentional taps
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "touch") return;
      if (isTouchScrollRef.current) {
        touchStartRef.current = null;
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const touchX = e.clientX - rect.left;
      const touchY = e.clientY - rect.top;

      const pts = pointsRef.current;
      let closestCityId: string | null = null;
      let closestDist = Infinity;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!p) continue;
        const screenX = (p.x / MAP_WIDTH) * rect.width;
        const screenY = (p.y / MAP_HEIGHT) * rect.height;
        const dist = Math.hypot(touchX - screenX, touchY - screenY);

        if (dist < closestDist) {
          closestDist = dist;
          closestCityId = p.city.id;
        }
      }

      const touchTapThreshold = 36;

      if (closestDist <= touchTapThreshold && closestCityId) {
        if (pinnedMarkerIdRef.current === closestCityId) {
          dismiss();
        } else {
          selectMarker(closestCityId, true);
        }
      } else {
        if (!isOverBubbleRef.current) {
          dismiss();
        }
      }

      touchStartRef.current = null;
    },
    [containerRef, dismiss, selectMarker],
  );

  // Marker click handler for desktop click / pin toggle
  const handleMarkerClick = useCallback(
    (cityId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (Date.now() - lastTouchTimeRef.current < 450) return;

      if (pinnedMarkerIdRef.current === cityId) {
        dismiss();
      } else {
        selectMarker(cityId, true);
      }
    },
    [dismiss, selectMarker],
  );

  // Keyboard navigation handler with Arrow key traversal
  const handleMarkerKeyDown = useCallback(
    (cityId: string, e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        if (pinnedMarkerIdRef.current === cityId) {
          dismiss();
        } else {
          selectMarker(cityId, true);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        dismiss();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const pts = pointsRef.current;
        const idx = pts.findIndex((p) => p.city.id === cityId);
        if (idx !== -1 && pts.length > 0) {
          const nextIdx = (idx + 1) % pts.length;
          const nextPt = pts[nextIdx];
          if (nextPt) {
            selectMarker(nextPt.city.id, pinnedMarkerIdRef.current !== null);
            const targetEl = containerRef.current?.querySelector(
              `[data-marker-id="${nextPt.city.id}"]`,
            ) as HTMLElement | SVGElement | null;
            targetEl?.focus();
          }
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const pts = pointsRef.current;
        const idx = pts.findIndex((p) => p.city.id === cityId);
        if (idx !== -1 && pts.length > 0) {
          const prevIdx = (idx - 1 + pts.length) % pts.length;
          const prevPt = pts[prevIdx];
          if (prevPt) {
            selectMarker(prevPt.city.id, pinnedMarkerIdRef.current !== null);
            const targetEl = containerRef.current?.querySelector(
              `[data-marker-id="${prevPt.city.id}"]`,
            ) as HTMLElement | SVGElement | null;
            targetEl?.focus();
          }
        }
      }
    },
    [containerRef, dismiss, selectMarker],
  );

  // Focus event handler for keyboard navigation
  const handleMarkerFocus = useCallback(
    (cityId: string) => {
      clearDismissTimer();
      if (!pinnedMarkerIdRef.current) {
        setFocusedMarkerId(cityId);
        announceStory(cityId, false);
        onMarkerSelect?.(cityId);
      }
    },
    [announceStory, clearDismissTimer, onMarkerSelect],
  );

  // Global escape key listener when bubble is open
  useEffect(() => {
    if (!activeMarkerId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeMarkerId, dismiss]);

  // Clean up animation frame and timer on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, []);

  const setBubbleLayout = useCallback((layout: BubbleLayout | null) => {
    bubbleLayoutRef.current = layout;
  }, []);

  return {
    activeMarkerId,
    hoveredMarkerId,
    pinnedMarkerId,
    focusedMarkerId,
    nearestMarkerId,
    isPinned,
    screenReaderAnnouncement,
    selectMarker,
    dismiss,
    isOverBubbleRef,
    setBubbleLayout,
    handlers: {
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onMarkerClick: handleMarkerClick,
      onMarkerKeyDown: handleMarkerKeyDown,
      onMarkerFocus: handleMarkerFocus,
    },
  };
}
