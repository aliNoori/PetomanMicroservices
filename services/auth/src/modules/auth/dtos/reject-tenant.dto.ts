import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectTenantDto {
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason!: string;
}