import {
  marketTheme,
} from "@/features/tenant";

import type {
  TenantCardBaseProps,
} from "@/features/tenant";


export function MarketTenantCard({
  tenant,
  onClick,
}: TenantCardBaseProps) {
  const isOnline = tenant.isOnline === true;

  const shortAddress = [
    tenant.address?.area,
    tenant.address?.city,
  ]
    .filter(Boolean)
    .join("، ");


  const statusClass = isOnline
    ? marketTheme.badge.online
    : marketTheme.badge.offline;


  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">

      {/* Cover */}
      <div
        className={`relative flex aspect-video items-center justify-center ${marketTheme.surface.highlight}`}
      >
        <span
          className={`text-sm font-medium ${marketTheme.accent.primary}`}
        >
          Market Image
        </span>


        {/* Status */}
        <span
          className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${statusClass}`}
        >
          {isOnline ? "Online" : "Offline"}
        </span>


        {/* Rating */}
        {tenant.rating !== undefined && (
          <span
            className={`absolute right-3 top-3 rounded-full border bg-surface px-3 py-1 text-xs font-semibold shadow-sm ${marketTheme.accent.primary} ${marketTheme.accent.border}`}
          >
            ★ {tenant.rating}
          </span>
        )}
      </div>


      {/* Content */}
      <div className="space-y-4 p-5">

        {/* Identity */}
        <div className="flex items-center gap-3">

          {/* Logo */}
          <div
            className={`flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-surface ${marketTheme.accent.border}`}
          >
            {tenant.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={`${tenant.name} logo`}
                className="size-full object-cover"
              />
            ) : (
              <span
                className={`text-xs font-semibold ${marketTheme.accent.primary}`}
              >
                Logo
              </span>
            )}
          </div>


          {/* Name */}
          <h3 className="min-w-0 truncate text-lg font-bold text-text-primary">
            {tenant.name}
          </h3>

        </div>


        {/* Address */}
        {shortAddress && (
          <div
            className={`text-sm font-medium ${marketTheme.accent.secondary}`}
          >
            📍 {shortAddress}
          </div>
        )}


        {/* Meta */}
        <div className="flex items-center justify-between gap-4 text-sm font-medium text-text-primary">

          {tenant.distance !== undefined && (
            <span>
              {tenant.distance} km away
            </span>
          )}

          <span className={isOnline
            ? marketTheme.accent.primary
            : "text-text-secondary"
          }>
            {isOnline
              ? "Open now"
              : "Currently offline"}
          </span>

        </div>


        {/* Action */}
        <button
          type="button"
          onClick={() => onClick?.(tenant)}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${marketTheme.button.primary}`}
        >
          View Details
        </button>

      </div>

    </article>
  );
}