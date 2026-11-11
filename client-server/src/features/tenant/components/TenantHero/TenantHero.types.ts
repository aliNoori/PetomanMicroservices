import type {
  TenantTheme,
} from "@/features/tenant";

export interface TenantHeroProps {
  title: string;
  description: string;
  theme: TenantTheme;
}