import type {
  TenantHeroProps,
} from "./TenantHero.types";


export function TenantHero({
  title,
  description,
  theme,
}: TenantHeroProps) {
  return (
    <section
      className={`rounded-3xl border p-8 ${theme.page.hero} ${theme.accent.border}`}
    >

      <div className="max-w-3xl">

        <h1
          className={`text-3xl font-bold ${theme.accent.primary}`}
        >
          {title}
        </h1>

        <p className="mt-3 max-w-2xl text-sm font-medium text-text-secondary">
          {description}
        </p>

      </div>

    </section>
  );
}