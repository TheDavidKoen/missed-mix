/* StackBubble.tsx — The dock's first bubble and the stack sheet it opens. The sheet
   is a native dialog, which supplies focus trapping and Escape to close.
   storeExitVector measures the gap between the sheet's centre and the bubble's, so
   the closing transition collapses the sheet back into the bubble it came from. */

import { useEffect, useRef, useState } from "react";

import { DOCK, STACK } from "~/content";

const ADR_BASE = "https://github.com/TheDavidKoen/missed-mix/blob/main/docs/adr";
const EXIT_SCALE = 0.06;

function storeExitVector(dialog: HTMLDialogElement, bubble: HTMLElement) {
  const sheetBox = dialog.getBoundingClientRect();
  const bubbleBox = bubble.getBoundingClientRect();

  const x = bubbleBox.left + bubbleBox.width / 2 - (sheetBox.left + sheetBox.width / 2);
  const y = bubbleBox.top + bubbleBox.height / 2 - (sheetBox.top + sheetBox.height / 2);

  dialog.style.setProperty("--sheet-exit-x", `${Math.round(x)}px`);
  dialog.style.setProperty("--sheet-exit-y", `${Math.round(y)}px`);
  dialog.style.setProperty("--sheet-exit-scale", String(EXIT_SCALE));
}

export function StackBubble() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const [openedByPointer, setOpenedByPointer] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const bubble = bubbleRef.current;
    if (!dialog || !bubble) return;

    const dismiss = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };

    const remeasure = () => {
      if (dialog.open) storeExitVector(dialog, bubble);
    };

    dialog.addEventListener("click", dismiss);
    window.addEventListener("resize", remeasure);

    return () => {
      dialog.removeEventListener("click", dismiss);
      window.removeEventListener("resize", remeasure);
    };
  }, []);

  const openSheet = () => {
    const dialog = dialogRef.current;
    const bubble = bubbleRef.current;
    if (!dialog || !bubble) return;

    dialog.showModal();
    storeExitVector(dialog, bubble);
  };

  return (
    <>
      <button
        ref={bubbleRef}
        type="button"
        className="launcher"
        style={
          {
            "--launcher-order": 0,
            "--launcher-mark": "url('/reactrouter.svg')",
          } as React.CSSProperties
        }
        aria-label={DOCK.stackLabel}
        aria-haspopup="dialog"
        aria-describedby="stack-tip"
        onPointerDown={() => setOpenedByPointer(true)}
        onKeyDown={() => setOpenedByPointer(false)}
        onClick={openSheet}
      >
        <span className="launcher__mark" aria-hidden="true" />
        <span className="launcher__tip" id="stack-tip" role="tooltip">
          {DOCK.stackTip}
        </span>
      </button>

      <dialog
        ref={dialogRef}
        className="sheet"
        aria-labelledby="stack-heading"
        onClose={() => {
          if (openedByPointer) bubbleRef.current?.blur();
        }}
      >
        <header className="sheet__bar">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              {DOCK.stackEyebrow}
            </p>
            <h2 id="stack-heading" className="mt-2 text-2xl font-black tracking-tight">
              {DOCK.stackHeading}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={DOCK.close}
            className="shrink-0 text-2xl leading-none text-muted transition-colors hover:text-ink"
          >
            &times;
          </button>
        </header>

        <div className="sheet__body">
          <dl className="grid gap-6">
            {STACK.map((entry) => (
              <div key={entry.choice} className="stack__row">
                <dt className="grid content-start gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted">
                    {entry.layer}
                  </span>
                  <span className="text-lg font-black tracking-tight">{entry.choice}</span>
                  {entry.logo ? (
                    <img
                      className="stack__logo"
                      src={entry.logo}
                      alt=""
                      width="24"
                      height="24"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </dt>

                <dd className="m-0 text-sm leading-relaxed text-muted">
                  {entry.why}
                  {entry.adr ? (
                    <a
                      href={`${ADR_BASE}/${entry.adr}.md`}
                      target="_blank"
                      rel="noopener"
                      className="ml-2 whitespace-nowrap text-xs font-bold text-accent underline-offset-4 hover:underline"
                    >
                      ADR {entry.adr.slice(0, 4)}
                    </a>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </dialog>
    </>
  );
}
