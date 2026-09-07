/* DockToggle.tsx — The dock's always-visible bubble, which expands and collapses the
   ones stowed behind it. syncDock writes the open state to the document element,
   where the stylesheet reads it, and marks the stowed bubbles inert so they stay
   unreachable by keyboard while invisible. Escape or a click outside collapses. */

import { useEffect, useRef, useState } from "react";

import { DOCK } from "~/content";

function syncDock(open: boolean) {
  document.documentElement.dataset.dock = open ? "open" : "closed";

  for (const bubble of document.querySelectorAll<HTMLElement>(".launcher--stowable")) {
    bubble.inert = !open;
  }
}

export function DockToggle() {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    syncDock(open);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const collapseOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };

    const collapseOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".launcher")) return;
      if (document.querySelector("dialog[open]")) return;
      setOpen(false);
    };

    document.addEventListener("keydown", collapseOnEscape);
    document.addEventListener("pointerdown", collapseOnOutsideClick);

    return () => {
      document.removeEventListener("keydown", collapseOnEscape);
      document.removeEventListener("pointerdown", collapseOnOutsideClick);
    };
  }, [open]);

  return (
    <button
      ref={toggleRef}
      type="button"
      className="launcher launcher--toggle"
      style={
        {
          "--launcher-order": 0,
          "--launcher-mark": "url('/plus.svg')",
        } as React.CSSProperties
      }
      aria-expanded={open}
      aria-label={DOCK.toggleLabel}
      aria-describedby="dock-tip"
      onClick={() => setOpen((wasOpen) => !wasOpen)}
    >
      <span className="launcher__mark" aria-hidden="true" />
      <span className="launcher__tip" id="dock-tip" role="tooltip">
        {DOCK.toggleTip}
      </span>
    </button>
  );
}
