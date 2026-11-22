import { IsNotEmpty, IsUUID } from 'class-validator';

export class ValidateTenantContextDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;
}
