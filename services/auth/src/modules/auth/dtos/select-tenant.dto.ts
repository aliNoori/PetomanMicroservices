import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

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

  /**
   * Refresh token identifying the current session.
   *
   * The server uses its hash to update only
   * the refresh-token session that initiated
   * this tenant selection.
   */
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}
