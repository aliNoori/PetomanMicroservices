import { vetTheme } from "@/features/tenant";

import type { VetTenantSummary } from "@/features/tenant";

interface VetTenantCardProps {
  tenant: VetTenantSummary;
  onClick?: (tenant: VetTenantSummary) => void;
}

export function VetTenantCard({ tenant, onClick }: VetTenantCardProps) {
  const isOnline = tenant.isOnline === true;

  const shortAddress = [tenant.address?.area, tenant.address?.city]
    .filter(Boolean)
    .join("، ");

  const statusClass = isOnline ? vetTheme.badge.online : vetTheme.badge.offline;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Cover */}
      <div className="relative h-36 overflow-visible">
        {tenant.coverImageUrl ? (
          <img
            src={tenant.coverImageUrl}
            alt=""
            className="size-full rounded-t-2xl object-cover"
          />
        ) : (
          <div
            className={`size-full rounded-t-2xl ${vetTheme.surface.highlight}`}
          />
        )}

        {/* Cover Overlay */}
        <div className="absolute inset-0 rounded-t-2xl bg-black/10" />

        {/* Status */}
        <span
          className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${statusClass}`}
        >
          {isOnline ? "Online" : "Offline"}
        </span>

        {/* Rating */}
        {tenant.rating !== undefined && (
          <span
            className={`absolute right-3 top-3 rounded-full border bg-surface px-3 py-1 text-xs font-semibold shadow-sm ${vetTheme.accent.primary} ${vetTheme.accent.border}`}
          >
            ★ {tenant.rating}
          </span>
        )}

        {/* Center Avatar */}
        <div className="absolute left-1/2 top-full z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="size-24 overflow-hidden rounded-full border-4 border-surface bg-surface shadow-lg">
            {tenant.avatarUrl ? (
              <img
                src={tenant.avatarUrl}
                alt={`${tenant.name} veterinarian`}
                className="size-full object-cover"
              />
            ) : (
              <div
                className={`flex size-full items-center justify-center ${vetTheme.surface.highlight}`}
              >
                <span
                  className={`text-xs font-semibold ${vetTheme.accent.primary}`}
                >
                  Avatar
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 px-5 pb-5 pt-14">
        {/* Doctor Identity */}
        <div className="space-y-1 text-center">
          <h3 className="truncate text-lg font-bold text-text-primary">
            {tenant.name}
          </h3>

          {tenant.specialty && (
            <p className={`text-sm font-medium ${vetTheme.accent.secondary}`}>
              {tenant.specialty}
            </p>
          )}
        </div>

        {/* Address */}
        {shortAddress && (
          <div className="text-sm font-medium text-text-secondary">
            📍 {shortAddress}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between gap-4 text-sm font-medium">
          {tenant.distance !== undefined && (
            <span className="text-text-secondary">
              {tenant.distance} km away
            </span>
          )}

          <span
            className={
              isOnline ? vetTheme.accent.primary : "text-text-secondary"
            }
          >
            {isOnline ? "Available now" : "Currently offline"}
          </span>
        </div>

        {/* Action */}
        <button
          type="button"
          onClick={() => onClick?.(tenant)}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${vetTheme.button.primary}`}
        >
          View Profile
        </button>
      </div>
    </article>
  );
}
