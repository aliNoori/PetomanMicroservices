import type { FeatureCardProps } from "./FeatureCard.types";

/**
 * Production-ready feature presentation card.
 *
 * The component is intentionally non-interactive by default and uses
 * semantic article markup to improve document structure and accessibility.
 */
export function FeatureCard({
  title,
  description,
  icon,
  className = "",
}: FeatureCardProps) {
  const classes = [
    "group rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm",
    "transition-[transform,box-shadow,border-color] duration-200 ease-out",
    "hover:-translate-y-1 hover:shadow-lg hover:border-border-strong",
    "motion-reduce:transition-none motion-reduce:transform-none",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes}>
      {icon ? (
        <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          {icon}
        </div>
      ) : null}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight text-text-primary">
          {title}
        </h3>

        <p className="text-sm leading-6 text-text-secondary">
          {description}
        </p>
      </div>
    </article>
  );
}