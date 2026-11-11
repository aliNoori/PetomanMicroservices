import {
  pharmacyTheme,
} from "@/features/tenant";

import type {
  TenantCardBaseProps,
} from "@/features/tenant";


export function PharmacyTenantCard({
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
    ? pharmacyTheme.badge.online
    : pharmacyTheme.badge.offline;


  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">

      {/* Cover */}
      <div
        className={`relative flex aspect-video items-center justify-center ${pharmacyTheme.surface.highlight}`}
      >
        <span
          className={`text-sm font-medium ${pharmacyTheme.accent.primary}`}
        >
          Pharmacy Image
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
            className={`absolute right-3 top-3 rounded-full border bg-surface px-3 py-1 text-xs font-semibold shadow-sm ${pharmacyTheme.accent.primary} ${pharmacyTheme.accent.border}`}
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
            className={`flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-surface ${pharmacyTheme.accent.border}`}
          >
            {tenant.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={`${tenant.name} logo`}
                className="size-full object-cover"
              />
            ) : (
              <span
                className={`text-xs font-semibold ${pharmacyTheme.accent.primary}`}
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
            className={`text-sm font-medium ${pharmacyTheme.accent.secondary}`}
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

          <span
            className={
              isOnline
                ? pharmacyTheme.accent.primary
                : "text-text-secondary"
            }
          >
            {isOnline
              ? "Open now"
              : "Currently offline"}
          </span>

        </div>


        {/* Action */}
        <button
          type="button"
          onClick={() => onClick?.(tenant)}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${pharmacyTheme.button.primary}`}
        >
          View Details
        </button>

      </div>

    </article>
  );
}