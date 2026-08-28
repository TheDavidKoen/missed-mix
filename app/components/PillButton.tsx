import type { ComponentProps } from "react";
import { Link } from "react-router";

const base =
  "inline-flex items-center justify-center gap-3 rounded-pill px-8 py-3 text-base font-bold tracking-tight transition duration-150 motion-safe:hover:scale-[1.03] active:scale-100 disabled:pointer-events-none disabled:opacity-60";

const variants = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border border-line text-ink hover:border-ink hover:bg-raised-hover",
} as const;

type Variant = keyof typeof variants;

export function PillLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function PillButton({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
