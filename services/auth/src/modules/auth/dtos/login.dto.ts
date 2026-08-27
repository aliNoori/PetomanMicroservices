import {
  IsEmail,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * Credentials required to authenticate a global user.
 *
 * tenantId is optional because a user can exist
 * without belonging to any tenant.
 *
 * When the user belongs to multiple tenants,
 * tenantId should be provided to explicitly select
 * the tenant context for the issued JWT.
 */
export class LoginDto {
  /**
   * Global user email address.
   */
  @IsEmail()
  email!: string;

  /**
   * Plain-text password supplied during authentication.
   *
   * The password is never persisted.
   */
  @IsString()
  @MinLength(8)
  password!: string;
}