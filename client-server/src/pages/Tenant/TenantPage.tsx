import { Navigate, useParams } from "react-router-dom";

import {
  AllTenantsSection,
  NearbyTenantsSection,
  OnlineTenantsSection,
  TenantHero,
  TopTenantsSection,
  getTenantTheme,
} from "@/features/tenant";

import type {
  TenantSummary,
  TenantType,
  TenantListItem,
} from "@/features/tenant";

import { isTenantType } from "@/features/tenant";

const mockTenants: TenantListItem[] = [
  {
    id: "tenant-1",
    name: "Happy Market",
    type: "markets",
    slug: "happy-market",
    rating: 4.8,
    distance: 1.2,
    isOnline: true,
    address: {
      city: "New York",
      area: "Manhattan",
      street: "123 Market St",
    },
  },

  {
    id: "tenant-2",
    name: "PetCare Veterinary",
    type: "vets",
    slug: "petcare-veterinary",

    rating: 4.9,
    distance: 2.4,
    isOnline: true,

    coverImageUrl:
      "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1200&h=500&fit=crop&q=80",

    avatarUrl:
      "https://i.pravatar.cc/300?img=12",

    specialty: "Small Animal & Emergency Care",

    consultationAvailable: true,

    address: {
      city: "New York",
      area: "Brooklyn",
      street: "456 Vet Ave",
    },
  },

  {
    id: "tenant-3",
    name: "Health Pharmacy",
    type: "pharmacies",
    slug: "health-pharmacy",
    rating: 4.7,
    distance: 3.1,
    isOnline: false,
    address: {
      city: "New York",
      area: "Queens",
      street: "789 Pharmacy Rd",
    },
  },
];

export function TenantPage() {
  const { tenantType } = useParams<{
    tenantType: TenantType;
  }>();

  if (!isTenantType(tenantType)) {
    return <Navigate to="/404" replace />;
  }

  const theme = getTenantTheme(tenantType);

  const tenants = mockTenants.filter((tenant) => tenant.type === tenantType);

  return (
    <main className={`min-h-screen ${theme.page.background}`}>
      <div className="mx-auto w-full max-w-7xl space-y-12 p-6">
        <TenantHero
          title="Discover Tenants"
          description="Find the best markets, veterinary clinics, and pharmacies around you."
          theme={theme}
        />

        <TopTenantsSection title="Top Tenants" tenants={tenants} />

        <NearbyTenantsSection title="Nearby Tenants" tenants={tenants} />

        <OnlineTenantsSection title="Online Tenants" tenants={tenants} />

        <AllTenantsSection title="All Tenants" tenants={tenants} />
      </div>
    </main>
  );
}
