/* StackBubble.tsx — A stowed dock bubble and the stack sheet it opens. The sheet is a
   native dialog, which supplies focus trapping and Escape to close; the click
   listener adds dismissal by backdrop, whose target is the dialog itself. */

import { useEffect, useRef, useState } from "react";

import { DOCK, STACK } from "~/content";

const ADR_BASE = "https://github.com/TheDavidKoen/missed-mix/blob/main/docs/adr";

export function StackBubble() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const [openedByPointer, setOpenedByPointer] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const dismiss = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };

    dialog.addEventListener("click", dismiss);
    return () => dialog.removeEventListener("click", dismiss);
  }, []);

  return (
    <>
      <button
        ref={bubbleRef}
        type="button"
        className="launcher launcher--stowable"
        style={
          {
            "--launcher-order": 1,
            "--launcher-mark": "url('/reactrouter.svg')",
          } as React.CSSProperties
        }
        aria-label={DOCK.stackLabel}
        aria-haspopup="dialog"
        aria-describedby="stack-tip"
        onPointerDown={() => setOpenedByPointer(true)}
        onKeyDown={() => setOpenedByPointer(false)}
        onClick={() => dialogRef.current?.showModal()}
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
