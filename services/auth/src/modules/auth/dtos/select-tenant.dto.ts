import {
  IsUUID,
} from 'class-validator';

export class SelectTenantDto {
  /**
   * Tenant that the authenticated user wants
   * to use as the current security context.
   *
   * The server MUST verify that the user has
   * an ACTIVE membership in this tenant.
   */
  @IsUUID()
  tenantId!: string;
}