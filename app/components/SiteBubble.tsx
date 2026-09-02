import { DOCK } from "~/content";

export function SiteBubble() {
  return (
    <a
      href={DOCK.siteHref}
      target="_blank"
      rel="noopener"
      className="launcher"
      style={{ "--launcher-order": 1 } as React.CSSProperties}
      aria-label={DOCK.siteLabel}
      aria-describedby="site-tip"
    >
      <img className="launcher__image" src="/d-mark.svg" alt="" width="27" height="27" />
      <span className="launcher__tip" id="site-tip" role="tooltip">
        {DOCK.siteTip}
      </span>
    </a>
  );
}
