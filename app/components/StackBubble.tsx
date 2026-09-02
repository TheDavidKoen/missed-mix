import { useEffect, useRef, useState } from "react";

import { DOCK, STACK } from "~/content";

const ADR_BASE = "https://github.com/TheDavidKoen/missed-mix/blob/main/docs/adr";

export function StackBubble() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [viaPointer, setViaPointer] = useState(false);

  /* Attached natively rather than as an onClick prop. Dismissing by backdrop is a
     behaviour of the dialog element, and its keyboard equivalent is Escape, which
     the browser already handles. As a JSX handler it reads to the linter as a
     click on a non-interactive element with no keyboard path. */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // A click on the backdrop lands on the dialog itself, never on a child.
    const dismiss = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };

    dialog.addEventListener("click", dismiss);
    return () => dialog.removeEventListener("click", dismiss);
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
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
        onPointerDown={() => setViaPointer(true)}
        onKeyDown={() => setViaPointer(false)}
        /* showModal gives focus trapping, Escape to close and an inert background. */
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
        /* The dialog restores focus to the launcher on close and the browser
           counts that as keyboard-driven, so a mouse user gets a focus ring
           they never asked for. Keyboard users keep theirs. */
        onClose={() => {
          if (viaPointer) buttonRef.current?.blur();
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
                    /* Decorative: the name sits directly above it, so alt text
                       would only repeat what has already been read out. */
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
