import { IsUUID } from 'class-validator';

export class RequestTenantMembershipDto {
  @IsUUID()
  tenantId!: string;
}