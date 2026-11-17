import {
  IsIn,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

import {
  TENANT_TYPE,
  type TenantType,
} from '../../../common/constants/tenant.constants';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens.',
  })
  slug!: string;

  @IsString()
  @IsIn(Object.values(TENANT_TYPE))
  type!: TenantType;
}